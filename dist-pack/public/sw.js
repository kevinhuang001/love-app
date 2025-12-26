if (!self.define) {
  let s,
    e = {}
  const i = (i, r) => (
    (i = new URL(i + '.js', r).href),
    e[i] ||
      new Promise((e) => {
        if ('document' in self) {
          const s = document.createElement('script')
          ;((s.src = i), (s.onload = e), document.head.appendChild(s))
        } else ((s = i), importScripts(i), e())
      }).then(() => {
        let s = e[i]
        if (!s) throw new Error(`Module ${i} didn’t register its module`)
        return s
      })
  )
  self.define = (r, l) => {
    const n = s || ('document' in self ? document.currentScript.src : '') || location.href
    if (e[n]) return
    let o = {}
    const u = (s) => i(s, n),
      t = { module: { uri: n }, exports: o, require: u }
    e[n] = Promise.all(r.map((s) => t[s] || u(s))).then((s) => (l(...s), o))
  }
}
define(['./workbox-8c29f6e4'], function (s) {
  'use strict'
  ;(self.skipWaiting(),
    s.clientsClaim(),
    s.precacheAndRoute(
      [
        { url: 'registerSW.js', revision: '1872c500de691dce40960bb85481de07' },
        { url: 'index.html', revision: '752603d75e42b33fe0acf8cddc89e74b' },
        { url: 'assets/vuestic-ui-hYeKHxJy.js', revision: null },
        { url: 'assets/vuestic-ui-DDnD9wr0.css', revision: null },
        { url: 'assets/vue-vendor-CS4KimFI.js', revision: null },
        { url: 'assets/vendor-Qzk3SZgC.js', revision: null },
        { url: 'assets/pairing.service-D6zThsnd.js', revision: null },
        { url: 'assets/moment.service-emWBjwx5.js', revision: null },
        { url: 'assets/message.service-0pLRvHXE.js', revision: null },
        { url: 'assets/message-Dym3VtgI.css', revision: null },
        { url: 'assets/index-DsixfF9C.css', revision: null },
        { url: 'assets/index-D_419K7i.js', revision: null },
        { url: 'assets/anniversary.service-D50iqdsx.js', revision: null },
        { url: 'assets/UpcomingDates-D277uwrZ.js', revision: null },
        { url: 'assets/Signup-CFOH8iRV.js', revision: null },
        { url: 'assets/RecoverPassword-CNWFQfQE.js', revision: null },
        { url: 'assets/MemoriesCarousel-CkLh4_DK.js', revision: null },
        { url: 'assets/LoveTimeline-BIJg47ol.js', revision: null },
        { url: 'assets/LoveTimeline-BIHWlc3y.css', revision: null },
        { url: 'assets/LoveSettings-DegUIPPK.js', revision: null },
        { url: 'assets/LoveProfile-CgrzggU4.js', revision: null },
        { url: 'assets/LovePairing-BvMZ9Us-.css', revision: null },
        { url: 'assets/LovePairing-BdYYqM7p.js', revision: null },
        { url: 'assets/LoveNotes-C8eMccdQ.js', revision: null },
        { url: 'assets/LoveMessages-D8gE5vuW.css', revision: null },
        { url: 'assets/LoveMessages-CBbr7pyl.js', revision: null },
        { url: 'assets/LoveDashboard-reUJScOt.css', revision: null },
        { url: 'assets/LoveDashboard-BMglu6Ui.js', revision: null },
        { url: 'assets/Login-Djkdg_kn.js', revision: null },
        { url: 'assets/CheckTheEmail-FwfkFGzL.js', revision: null },
        { url: 'assets/404-CyiAwkBD.js', revision: null },
        { url: 'android-chrome-192x192.png', revision: '2dffd6311ba43e15ce48cba17cbfd129' },
        { url: 'android-chrome-512x512.png', revision: 'a9f31e2966bdfb1b9895583fd3b2fdb5' },
        { url: 'apple-touch-icon.png', revision: '86941987a44c7dafd77c04339c6bb261' },
        { url: 'favicon.ico', revision: 'aadbe8f9e45244ade9f4857450459f7d' },
        { url: 'logo.svg', revision: 'd5a4878ca182461018a9b76875741875' },
        { url: 'manifest.webmanifest', revision: 'f216e9a3791c812a06df9274415f5a7c' },
      ],
      {},
    ),
    s.cleanupOutdatedCaches(),
    s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL('index.html'))))
})
//# sourceMappingURL=sw.js.map
