import { useEffect, useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const projects = [
  { number: "01", category: "Client", name: "Nextlevel Studio", images: [
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055344_5eff02e0-87a5-41ce-b64f-eb08da8f33db.png&w=1280&q=85",
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055431_11d841fd-8b41-46a5-82e4-b04f2407a7d8.png&w=1280&q=85",
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055451_e317bf2d-28d4-48cc-86b0-6f72f25b6327.png&w=1280&q=85",
  ]},
  { number: "02", category: "Personal", name: "Aura Brand Identity", images: [
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055654_911201c5-36d9-4bc6-bac7-331adfce159f.png&w=1280&q=85",
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055723_5ceda0b8-d9c2-4665-b2e3-83ba19ba76d1.png&w=1280&q=85",
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055753_adc5dcbd-a8e6-49c0-b43a-9b030d835cea.png&w=1280&q=85",
  ]},
  { number: "03", category: "Client", name: "Solaris Digital", images: [
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055759_963cfb0b-4bd1-4b0f-9d0a-09bd6cf95b2f.png&w=1280&q=85",
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_060108_438f781a-9846-4dcc-89ab-c4e6cb830f5b.png&w=1280&q=85",
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055818_9d062121-ad7e-46b9-999a-1a6a692ef1ee.png&w=1280&q=85",
  ]},
];

const firstRow = [
  "https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif",
  "https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif",
  "https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif",
  "https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif",
  "https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif",
  "https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif",
  "https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif",
  "https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif",
  "https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif",
  "https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif",
  "https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif",
];

const secondRow = [
  "https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif",
  "https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif",
  "https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif",
  "https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif",
  "https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif",
  "https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif",
  "https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif",
  "https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif",
  "https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif",
  "https://motionsites.ai/assets/hero-celestia-preview-0yO3jXO8.gif",
];

const services = [
  { number: "01", name: "3D Modeling", description: "Creation of detailed objects, characters, or environments tailored to specific client needs, ideal for games, products, and visualizations." },
  { number: "02", name: "Rendering", description: "High-quality, photorealistic renders that showcase designs with custom lighting, textures, and materials to bring concepts to life." },
  { number: "03", name: "Motion Design", description: "Dynamic animations and motion graphics that add energy and storytelling to brands, products, and digital experiences." },
  { number: "04", name: "Branding", description: "Crafting cohesive visual identities -- from logos to full brand systems -- that communicate a clear and memorable presence." },
  { number: "05", name: "Web Design", description: "Designing clean, modern, and conversion-focused websites with attention to layout, typography, and user experience." },
];

const aboutText = "With more than five years of experience in design, i focus on branding, web design, and user experience, i truly enjoy working with businesses that aim to stand out and present their best image. Let's build something incredible together!";

function FadeIn({ children, delay = 0, duration = 0.7, x = 0, y = 30, className = "" }: {
  children: ReactNode; delay?: number; duration?: number; x?: number; y?: number; className?: string;
}) {
  return <motion.div initial={{ opacity: 0, x, y }} whileInView={{ opacity: 1, x: 0, y: 0 }}
    viewport={{ once: true, margin: "50px", amount: 0 }} transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }} className={className}>{children}</motion.div>;
}

function ContactButton({ delay = 0 }: { delay?: number }) {
  return <FadeIn delay={delay} y={20}><a className="contact-button" href="mailto:?subject=Portfolio%20inquiry">Contact Me <ArrowUpRight size={18} /></a></FadeIn>;
}

function Magnet({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const move = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const near = event.clientX >= rect.left - 150 && event.clientX <= rect.right + 150 &&
        event.clientY >= rect.top - 150 && event.clientY <= rect.bottom + 150;
      if (!near) {
        element.style.transition = "transform 0.6s ease-in-out";
        element.style.transform = "translate3d(0, 0, 0)";
        return;
      }
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      element.style.transition = "transform 0.3s ease-out";
      element.style.transform = "translate3d(" + dx / 3 + "px, " + dy / 3 + "px, 0)";
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div className="magnet-anchor"><div ref={ref} className="magnet" style={{ willChange: "transform" }}>{children}</div></div>;
}

function AnimatedCharacter({ character, index, length, progress }: {
  character: string; index: number; length: number; progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [index / length, (index + 1) / length], [0.2, 1]);
  const visible = character === " " ? "\u00a0" : character;
  return <span className="animated-char"><span className="char-placeholder">{visible}</span><motion.span className="char-reveal" style={{ opacity }} aria-hidden="true">{visible}</motion.span></span>;
}

function AnimatedText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.2"] });
  const characters = Array.from(text);
  return <p ref={ref} className="animated-text">{characters.map((character, index) =>
    <AnimatedCharacter key={index} character={character} index={index} length={characters.length} progress={scrollYProgress} />)}</p>;
}

function HeroSection() {
  return <section className="hero" id="home">
    <FadeIn className="hero-nav-wrap" delay={0} y={-20}>
      <nav className="hero-nav" aria-label="Main navigation">
        <a href="#about">About</a><a href="#services">Price</a><a href="#projects">Projects</a><a href="#contact">Contact</a>
      </nav>
    </FadeIn>
    <div className="hero-heading-wrap"><FadeIn delay={0.15} y={40}><h1 className="hero-heading"><span>Hi, i&apos;m</span><span>Emil Kowalski</span></h1></FadeIn></div>
    <Magnet><FadeIn className="hero-portrait-wrap" delay={0.6} y={30}>
      <img className="hero-portrait" src="https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png" alt="3D portrait artwork" fetchPriority="high" />
    </FadeIn></Magnet>
    <div className="hero-bottom">
      <FadeIn delay={0.35} y={20}><p className="hero-copy">a 3d creator driven by crafting striking and unforgettable projects</p></FadeIn>
      <div id="contact"><ContactButton delay={0.5} /></div>
    </div>
    <div className="hero-scroll-cue" aria-hidden="true"><span>Scroll to explore</span><ArrowDownRight size={17} /></div>
  </section>;
}

function MarqueeRow({ images, direction, className }: { images: string[]; direction: "right" | "left"; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], direction === "right" ? [-200, 200] : [200, -200]);
  const repeated = [...images, ...images, ...images];
  return <div ref={ref} className="marquee-viewport">
    <motion.div className={"marquee-track " + className} style={{ x, willChange: "transform" }}>
      {repeated.map((src, index) => <img key={src + index} src={src} alt="" loading="lazy" className="marquee-image" />)}
    </motion.div>
  </div>;
}

function MarqueeSection() {
  return <section className="marquee-section" aria-label="Selected visual work">
    <MarqueeRow images={firstRow} direction="right" className="marquee-row-one" />
    <MarqueeRow images={secondRow} direction="left" className="marquee-row-two" />
    <p className="marquee-caption">A world built in three dimensions</p>
  </section>;
}

const decor = [
  { src: "https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png", alt: "Moon", className: "decor-moon", x: -80, delay: 0.1 },
  { src: "https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png", alt: "Abstract 3D object", className: "decor-object", x: -80, delay: 0.25 },
  { src: "https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png", alt: "Lego icon", className: "decor-lego", x: 80, delay: 0.15 },
  { src: "https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png", alt: "3D group", className: "decor-group", x: 80, delay: 0.3 },
];

function AboutSection() {
  return <section className="about-section" id="about">
    {decor.map((item) => <FadeIn key={item.className} className={"about-decor " + item.className} delay={item.delay} duration={0.9} x={item.x} y={0}>
      <img src={item.src} alt={item.alt} loading="lazy" />
    </FadeIn>)}
    <div className="about-content">
      <FadeIn><h2 className="hero-heading section-heading">About me</h2></FadeIn>
      <AnimatedText text={aboutText} />
      <div className="about-contact"><ContactButton /></div>
    </div>
  </section>;
}

function ServicesSection() {
  return <section className="services-section" id="services">
    <FadeIn><h2 className="section-heading service-heading">Services</h2></FadeIn>
    <div className="services-list">{services.map((service, index) => <FadeIn key={service.number} delay={index * 0.1} y={24}>
      <article className="service-item"><span className="service-number">{service.number}</span>
        <div className="service-copy"><h3>{service.name}</h3><p>{service.description}</p></div></article>
    </FadeIn>)}</div>
  </section>;
}

function ProjectCard({ project, index, total }: { project: (typeof projects)[number]; index: number; total: number }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const targetScale = 1 - (total - 1 - index) * 0.03;
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);
  return <div className="project-card-space">
    <motion.article ref={ref} className="project-card" style={{ scale, top: 96 + index * 28 }}>
      <div className="project-topline"><div className="project-index">{project.number}</div>
        <div className="project-heading"><span className="project-category">{project.category}</span><h3>{project.name}</h3></div>
        <a className="live-project-button" href={"mailto:?subject=Project%20inquiry%20" + encodeURIComponent(project.name)}>Live Project <ArrowUpRight size={17} /></a>
      </div>
      <div className="project-image-grid"><div className="project-image-stack">
        <img src={project.images[0]} alt={project.name + " render one"} loading="lazy" />
        <img src={project.images[1]} alt={project.name + " render two"} loading="lazy" />
      </div><img className="project-image-tall" src={project.images[2]} alt={project.name + " featured render"} loading="lazy" /></div>
    </motion.article>
  </div>;
}

function ProjectsSection() {
  return <section className="projects-section" id="projects">
    <FadeIn className="projects-heading-wrap"><h2 className="hero-heading section-heading">Project</h2></FadeIn>
    <div className="projects-stack">{projects.map((project, index) =>
      <ProjectCard key={project.number} project={project} index={index} total={projects.length} />)}</div>
    <footer className="site-footer"><span>Emil Kowalski <i>·</i> 3D Creator</span>
      <a href="mailto:?subject=Portfolio%20inquiry" aria-label="Contact Emil Kowalski">Let&apos;s create something <ArrowUpRight size={16} /></a></footer>
  </section>;
}

export default function App() {
  return <main className="site-shell"><HeroSection /><MarqueeSection /><AboutSection /><ServicesSection /><ProjectsSection /></main>;
}