(function (root) {
  'use strict';

  var posts = [
    {
      id: 'kathmandu-evening',
      type: 'audio-poetry',
      author: 'a girl',
      location: 'काठमाडौं',
      postedAt: '२ घण्टा अघि',
      profileImage: 'assets/shabdalaya-girl-profile.jpg',
      title: 'काठमाडौंको साँझ',
      lines: [
        'यो सहरको भीडभित्र,',
        'मनले आफ्नै बाटो खोज्छ।',
        'शब्दहरू चुप लाग्दा पनि,',
        'मौनले कथा सुनाइरहन्छ।'
      ],
      description: 'सहरको आवाजबीच मनले सुन्ने आफ्नै कविता।',
      tags: ['#शब्दलय', '#नेपालीकविता', '#काठमाडौं', '#मनका_कुरा'],
      audio: 'assets/shabdalaya-kathmandu-poem.m4a'
    }
  ];

  root.DEUDALAYA_SHABDALAYA_POETRY_POSTS = Object.freeze(posts.map(function (post) {
    post.lines = Object.freeze(post.lines.slice());
    post.tags = Object.freeze(post.tags.slice());
    return Object.freeze(post);
  }));
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.DEUDALAYA_SHABDALAYA_POETRY_POSTS;
}
