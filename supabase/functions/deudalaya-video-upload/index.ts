import { createClient } from 'npm:@supabase/supabase-js@2'
import { createPublishHandler } from './handler.mjs'

const PROJECT_REF = 'bxzkclqanpuvxyhsrpog'
const BUCKET = 'videos'
const FEED_SELECT = 'id,user_id,media_path,media_type,caption,category'

const projectUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const pipelineToken = Deno.env.get('DEUDALAYA_VIDEO_PIPELINE_TOKEN') ?? ''

if (projectUrl !== `https://${PROJECT_REF}.supabase.co` || !serviceRoleKey || pipelineToken.length < 32) {
  throw new Error('Video publisher server configuration is incomplete')
}

const supabase = createClient(projectUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function failIfError(error: unknown, code: string): void {
  if (error) throw new Error(code)
}

const repository = {
  async getPublisherUserId(): Promise<string> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', 'deudalaya')
      .maybeSingle()
    failIfError(error, 'publisher_profile_lookup_failed')
    if (!data?.id) throw new Error('publisher_profile_missing')
    return data.id
  },

  async preflight(): Promise<void> {
    await this.getPublisherUserId()
    const { error: bucketError } = await supabase.storage.from(BUCKET).list('', { limit: 1 })
    failIfError(bucketError, 'video_bucket_unavailable')
    const { error: schemaError } = await supabase.from('feed_posts').select(FEED_SELECT).limit(0)
    failIfError(schemaError, 'feed_posts_schema_unavailable')
  },

  async findFeedRows(objectPath: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabase.from('feed_posts').select(FEED_SELECT).eq('media_path', objectPath).limit(2)
    failIfError(error, 'feed_duplicate_lookup_failed')
    return data ?? []
  },

  async hasStorageObject(objectPath: string): Promise<boolean> {
    const [folder, name] = objectPath.split('/')
    const { data, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 2, search: name })
    failIfError(error, 'storage_duplicate_lookup_failed')
    return (data ?? []).some((item) => item.name === name)
  },

  async downloadStorageObject(objectPath: string): Promise<Uint8Array | null> {
    const { data, error } = await supabase.storage.from(BUCKET).download(objectPath)
    if (error) {
      const status = Number((error as { statusCode?: string; status?: number }).statusCode
        ?? (error as { status?: number }).status
        ?? 0)
      if (status === 404 || /not found/i.test(error.message || '')) return null
      throw new Error('storage_download_failed')
    }
    return data ? new Uint8Array(await data.arrayBuffer()) : null
  },

  async uploadStorageObject(objectPath: string, bytes: Uint8Array): Promise<void> {
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
      cacheControl: '3600',
      contentType: 'video/mp4',
      upsert: false,
    })
    if (error) {
      const status = String((error as { statusCode?: string; status?: number }).statusCode
        ?? (error as { status?: number }).status
        ?? '')
      if (status === '409' || /already exists|duplicate/i.test(error.message || '')) {
        throw Object.assign(new Error('object_exists'), { code: 'object_exists' })
      }
      throw new Error('storage_upload_failed')
    }
  },

  async insertFeedPost(record: Record<string, string>): Promise<Record<string, unknown>> {
    const { data, error } = await supabase.from('feed_posts').insert(record).select(FEED_SELECT).single()
    failIfError(error, 'feed_insert_failed')
    return data
  },
}

Deno.serve(createPublishHandler({ repository, pipelineToken }))
