const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      'assets/LoveDashboard-BMglu6Ui.js',
      'assets/vuestic-ui-hYeKHxJy.js',
      'assets/vue-vendor-CS4KimFI.js',
      'assets/vendor-Qzk3SZgC.js',
      'assets/vuestic-ui-DDnD9wr0.css',
      'assets/message.service-0pLRvHXE.js',
      'assets/message-Dym3VtgI.css',
      'assets/anniversary.service-D50iqdsx.js',
      'assets/moment.service-emWBjwx5.js',
      'assets/LoveDashboard-reUJScOt.css',
      'assets/LoveTimeline-BIJg47ol.js',
      'assets/LoveTimeline-BIHWlc3y.css',
      'assets/LoveMessages-CBbr7pyl.js',
      'assets/LoveMessages-D8gE5vuW.css',
      'assets/LoveProfile-CgrzggU4.js',
      'assets/pairing.service-D6zThsnd.js',
      'assets/LovePairing-BdYYqM7p.js',
      'assets/LovePairing-BvMZ9Us-.css',
      'assets/LoveSettings-DegUIPPK.js',
      'assets/Login-Djkdg_kn.js',
      'assets/Signup-CFOH8iRV.js',
      'assets/RecoverPassword-CNWFQfQE.js',
      'assets/CheckTheEmail-FwfkFGzL.js',
      'assets/404-CyiAwkBD.js',
    ]),
) => i.map((i) => d[i])
import {
  u as B,
  a as K,
  V as Q,
  b as le,
  c as se,
  d as me,
  e as ce,
  f as ue,
  g as ze,
  h as W,
  i as de,
  j as H,
  k as pe,
  l as _e,
  m as ge,
  n as he,
  o as fe,
  p as ve,
  q as be,
  r as ye,
  s as we,
  t as Se,
  v as ke,
  w as Ce,
} from './vuestic-ui-hYeKHxJy.js'
import {
  aa as Z,
  k as V,
  G as X,
  E as Y,
  c as w,
  a3 as N,
  o as p,
  ab as Ve,
  ac as xe,
  u as b,
  w as m,
  C as g,
  L as s,
  q as k,
  ad as q,
  ae as ee,
  af as ne,
  ag as oe,
  a as C,
  n as re,
  F as j,
  D as M,
  r as I,
  d as Ie,
  v as $,
  m as Ae,
  t as A,
  X as Te,
  x as E,
  H as Ne,
  ah as Le,
  ai as $e,
  aj as Ee,
  ak as Be,
} from './vue-vendor-CS4KimFI.js'
import './vendor-Qzk3SZgC.js'
;(function () {
  const n = document.createElement('link').relList
  if (n && n.supports && n.supports('modulepreload')) return
  for (const t of document.querySelectorAll('link[rel="modulepreload"]')) o(t)
  new MutationObserver((t) => {
    for (const i of t)
      if (i.type === 'childList')
        for (const a of i.addedNodes) a.tagName === 'LINK' && a.rel === 'modulepreload' && o(a)
  }).observe(document, { childList: !0, subtree: !0 })
  function r(t) {
    const i = {}
    return (
      t.integrity && (i.integrity = t.integrity),
      t.referrerPolicy && (i.referrerPolicy = t.referrerPolicy),
      t.crossOrigin === 'use-credentials'
        ? (i.credentials = 'include')
        : t.crossOrigin === 'anonymous'
          ? (i.credentials = 'omit')
          : (i.credentials = 'same-origin'),
      i
    )
  }
  function o(t) {
    if (t.ep) return
    t.ep = !0
    const i = r(t)
    fetch(t.href, i)
  }
})()
const De = () => {
    const { protocol: e, hostname: n, port: r } = window.location
    return r === '5173' ? `${e}//${n}:3000` : `${e}//${n}:${r}`
  },
  D = De(),
  P = async (e, n = {}) => {
    const r = localStorage.getItem('token'),
      o = { Accept: 'application/json', ...(r ? { Authorization: `Bearer ${r}` } : {}), ...n.headers }
    ;(!o['Content-Type'] && n.body && !(n.body instanceof FormData) && (o['Content-Type'] = 'application/json'),
      o['Content-Type'] === 'application/json' &&
        n.body &&
        typeof n.body != 'string' &&
        (n.body = JSON.stringify(n.body)),
      n.body || delete o['Content-Type'])
    try {
      const t = await fetch(`${D}${e}`, { ...n, headers: o, credentials: 'include' }),
        i = await t.json().catch(() => ({}))
      if (!t.ok) throw new Error(i.error || `Request failed with status ${t.status}`)
      return i
    } catch (t) {
      throw t
    }
  },
  F = (e) =>
    e
      ? e.startsWith('http')
        ? e.includes('?t=')
          ? e
          : `${e}${e.includes('?') ? '&' : '?'}t=${Date.now()}`
        : `${D}${e}${e.includes('?') ? '&' : '?'}t=${Date.now()}`
      : '',
  On = () => `${D}/api/auth/captcha?t=${Date.now()}`,
  T = Z('user', {
    state: () => ({
      id: null,
      userName: '',
      displayName: '',
      email: '',
      memberSince: '',
      pfp: '',
      partnerId: null,
      partner: null,
      token: localStorage.getItem('token') || '',
      preferences: {
        noteTheme: localStorage.getItem('noteTheme') || 'bg-blue-50',
        noteBubbleColor: localStorage.getItem('noteBubbleColor') || '#ffffff',
        noteCardColor: localStorage.getItem('noteCardColor') || '#ffffff',
        heroTheme: localStorage.getItem('heroTheme') || 'bg-pink-50',
        carouselLimit: Number(localStorage.getItem('carouselLimit')) || 5,
        noteLimit: Number(localStorage.getItem('noteLimit')) || 1,
        showNoteDate: localStorage.getItem('showNoteDate') !== 'false',
        showNoteAuthor: localStorage.getItem('showNoteAuthor') !== 'false',
        appName: localStorage.getItem('appName') || 'Our Love Journey',
        appEmoji: localStorage.getItem('appEmoji') || '❤️',
        theme: localStorage.getItem('theme') || 'light',
        cardColors: JSON.parse(localStorage.getItem('cardColors') || '{}'),
        dashboardOrder: JSON.parse(localStorage.getItem('dashboardOrder') || '["dates", "memories", "notes"]'),
      },
    }),
    actions: {
      updatePreferences(e) {
        this.preferences = { ...this.preferences, ...e }
        try {
          ;(e.noteTheme !== void 0 && localStorage.setItem('noteTheme', e.noteTheme),
            e.noteBubbleColor !== void 0 && localStorage.setItem('noteBubbleColor', e.noteBubbleColor),
            e.noteCardColor !== void 0 && localStorage.setItem('noteCardColor', e.noteCardColor),
            e.heroTheme !== void 0 && localStorage.setItem('heroTheme', e.heroTheme),
            e.carouselLimit !== void 0 && localStorage.setItem('carouselLimit', String(e.carouselLimit)),
            e.noteLimit !== void 0 && localStorage.setItem('noteLimit', String(e.noteLimit)),
            e.showNoteDate !== void 0 && localStorage.setItem('showNoteDate', String(e.showNoteDate)),
            e.showNoteAuthor !== void 0 && localStorage.setItem('showNoteAuthor', String(e.showNoteAuthor)),
            e.appName !== void 0 && localStorage.setItem('appName', e.appName),
            e.appEmoji !== void 0 && localStorage.setItem('appEmoji', e.appEmoji),
            e.theme !== void 0 && localStorage.setItem('theme', e.theme),
            e.cardColors !== void 0 && localStorage.setItem('cardColors', JSON.stringify(e.cardColors)),
            e.dashboardOrder !== void 0 && localStorage.setItem('dashboardOrder', JSON.stringify(e.dashboardOrder)),
            e.appName !== void 0 && (document.title = e.appName))
        } catch (n) {
          console.error('Failed to save preferences:', n)
        }
      },
      async login(e, n, r) {
        try {
          const o = await P('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username: e, password: n, captcha: r }),
          })
          return o.token
            ? ((this.token = o.token),
              (this.id = o.user.id),
              (this.userName = o.user.username),
              (this.displayName = o.user.displayName),
              (this.pfp = F(o.user.avatarUrl)),
              (this.partnerId = o.user.partnerId),
              localStorage.setItem('token', o.token),
              { success: !0 })
            : { success: !1, error: 'Token missing' }
        } catch (o) {
          return { success: !1, error: o.message }
        }
      },
      async register(e, n, r, o, t) {
        try {
          return (
            await P('/api/auth/register', {
              method: 'POST',
              body: JSON.stringify({ username: e, password: n, displayName: r, birthday: o, captcha: t }),
            }),
            { success: !0 }
          )
        } catch (i) {
          return { success: !1, error: i.message }
        }
      },
      async updateProfile(e, n) {
        return new Promise((r, o) => {
          const t = new XMLHttpRequest()
          t.withCredentials = !0
          const i = localStorage.getItem('token')
          ;(t.open('PUT', `${D}/api/auth/profile`),
            i && t.setRequestHeader('Authorization', `Bearer ${i}`),
            n &&
              t.upload &&
              (t.upload.onprogress = (a) => {
                a.lengthComputable && n(Math.round((a.loaded / a.total) * 100))
              }),
            (t.onload = () => {
              if (t.status >= 200 && t.status < 300)
                try {
                  r(JSON.parse(t.responseText))
                } catch (a) {
                  o(a)
                }
              else
                try {
                  const a = JSON.parse(t.responseText)
                  o(new Error(a.error || `Update failed with status ${t.status}`))
                } catch {
                  o(new Error(`Update failed with status ${t.status}`))
                }
            }),
            (t.onerror = () => o(new Error('Network error'))),
            t.send(e))
        })
      },
      async checkAuth() {
        if (!this.token) return !1
        try {
          const e = await P('/api/auth/me')
          return (
            (this.id = e.id),
            (this.userName = e.username),
            (this.displayName = e.displayName),
            (this.pfp = F(e.avatarUrl)),
            (this.partnerId = e.partnerId),
            (this.partner = e.partner ? { ...e.partner, avatarUrl: F(e.partner.avatarUrl) } : null),
            !0
          )
        } catch {
          return (this.logout(), !1)
        }
      },
      logout() {
        ;((this.token = ''),
          (this.id = null),
          (this.userName = ''),
          (this.displayName = ''),
          (this.pfp = ''),
          (this.partnerId = null),
          (this.partner = null),
          localStorage.removeItem('token'))
      },
    },
  }),
  Oe = V({
    __name: 'App',
    setup(e) {
      const n = T(),
        { applyPreset: r } = B(),
        o = (t) => {
          ;(r(t),
            t === 'dark'
              ? document.documentElement.classList.add('dark')
              : document.documentElement.classList.remove('dark'))
        }
      return (
        X(() => {
          ;((document.title = n.preferences.appName), o(n.preferences.theme))
        }),
        Y(
          () => n.preferences.theme,
          (t) => {
            o(t)
          },
        ),
        (t, i) => {
          const a = N('RouterView')
          return (p(), w(a))
        }
      )
    },
  }),
  Re = {
    auth: {
      agree: (e) => {
        const { normalize: n } = e
        return n(['我同意'])
      },
      createAccount: (e) => {
        const { normalize: n } = e
        return n(['创建账号'])
      },
      createNewAccount: (e) => {
        const { normalize: n } = e
        return n(['创建新账号'])
      },
      email: (e) => {
        const { normalize: n } = e
        return n(['电子邮箱'])
      },
      login: (e) => {
        const { normalize: n } = e
        return n(['登录'])
      },
      password: (e) => {
        const { normalize: n } = e
        return n(['密码'])
      },
      recover_password: (e) => {
        const { normalize: n } = e
        return n(['恢复密码'])
      },
      sign_up: (e) => {
        const { normalize: n } = e
        return n(['注册'])
      },
      keep_logged_in: (e) => {
        const { normalize: n } = e
        return n(['保持登录'])
      },
      termsOfUse: (e) => {
        const { normalize: n } = e
        return n(['使用条款'])
      },
      reset_password: (e) => {
        const { normalize: n } = e
        return n(['重置密码'])
      },
    },
    404: {
      title: (e) => {
        const { normalize: n } = e
        return n(['此页面已去钓鱼'])
      },
      text: (e) => {
        const { normalize: n } = e
        return n(['如果您觉得这不对，请给我们发送消息'])
      },
      back_button: (e) => {
        const { normalize: n } = e
        return n(['返回仪表板'])
      },
    },
    typography: {
      primary: (e) => {
        const { normalize: n } = e
        return n(['主要文本样式'])
      },
      secondary: (e) => {
        const { normalize: n } = e
        return n(['次要文本样式'])
      },
    },
    dashboard: {
      versions: (e) => {
        const { normalize: n } = e
        return n(['版本'])
      },
      setupRemoteConnections: (e) => {
        const { normalize: n } = e
        return n(['设置远程连接'])
      },
      currentVisitors: (e) => {
        const { normalize: n } = e
        return n(['当前访问者'])
      },
      charts: {
        trendyTrends: (e) => {
          const { normalize: n } = e
          return n(['流行趋势'])
        },
        showInMoreDetail: (e) => {
          const { normalize: n } = e
          return n(['显示更多细节'])
        },
        showInLessDetail: (e) => {
          const { normalize: n } = e
          return n(['显示较少细节'])
        },
        loadingSpeed: (e) => {
          const { normalize: n } = e
          return n(['加载速度'])
        },
        topContributors: (e) => {
          const { normalize: n } = e
          return n(['主要贡献者'])
        },
        showNextFive: (e) => {
          const { normalize: n } = e
          return n(['显示接下来的五个'])
        },
        commits: (e) => {
          const { normalize: n } = e
          return n(['提交'])
        },
      },
      info: {
        componentRichTheme: (e) => {
          const { normalize: n } = e
          return n(['组件丰富的主题'])
        },
        completedPullRequests: (e) => {
          const { normalize: n } = e
          return n(['已完成的拉取请求'])
        },
        users: (e) => {
          const { normalize: n } = e
          return n(['用户'])
        },
        points: (e) => {
          const { normalize: n } = e
          return n(['点数'])
        },
        units: (e) => {
          const { normalize: n } = e
          return n(['单位'])
        },
        exploreGallery: (e) => {
          const { normalize: n } = e
          return n(['探索画廊'])
        },
        viewLibrary: (e) => {
          const { normalize: n } = e
          return n(['查看库'])
        },
        commits: (e) => {
          const { normalize: n } = e
          return n(['提交'])
        },
        components: (e) => {
          const { normalize: n } = e
          return n(['组件'])
        },
        teamMembers: (e) => {
          const { normalize: n } = e
          return n(['团队成员'])
        },
      },
      tabs: {
        overview: {
          title: (e) => {
            const { normalize: n } = e
            return n(['概述'])
          },
          built: (e) => {
            const { normalize: n } = e
            return n(['使用 Vue.js 框架构建'])
          },
          free: (e) => {
            const { normalize: n } = e
            return n(['对所有人完全免费'])
          },
          fresh: (e) => {
            const { normalize: n } = e
            return n(['新鲜和清新的设计'])
          },
          mobile: (e) => {
            const { normalize: n } = e
            return n(['响应式且优化移动'])
          },
          components: (e) => {
            const { normalize: n } = e
            return n(['大量有用的组件'])
          },
          nojQuery: (e) => {
            const { normalize: n } = e
            return n(['完全不使用 jQuery'])
          },
        },
        billingAddress: {
          title: (e) => {
            const { normalize: n } = e
            return n(['账单地址'])
          },
          personalInfo: (e) => {
            const { normalize: n } = e
            return n(['个人信息'])
          },
          firstName: (e) => {
            const { normalize: n } = e
            return n(['名字 & 姓氏'])
          },
          email: (e) => {
            const { normalize: n } = e
            return n(['电子邮箱'])
          },
          address: (e) => {
            const { normalize: n } = e
            return n(['地址'])
          },
          companyInfo: (e) => {
            const { normalize: n } = e
            return n(['公司信息'])
          },
          city: (e) => {
            const { normalize: n } = e
            return n(['城市'])
          },
          country: (e) => {
            const { normalize: n } = e
            return n(['国家'])
          },
          infiniteConnections: (e) => {
            const { normalize: n } = e
            return n(['无限连接'])
          },
          addConnection: (e) => {
            const { normalize: n } = e
            return n(['添加连接'])
          },
        },
        bankDetails: {
          title: (e) => {
            const { normalize: n } = e
            return n(['银行详情'])
          },
          detailsFields: (e) => {
            const { normalize: n } = e
            return n(['详情字段'])
          },
          bankName: (e) => {
            const { normalize: n } = e
            return n(['银行名称'])
          },
          accountName: (e) => {
            const { normalize: n } = e
            return n(['账户名称'])
          },
          sortCode: (e) => {
            const { normalize: n } = e
            return n(['排序代码'])
          },
          accountNumber: (e) => {
            const { normalize: n } = e
            return n(['账号'])
          },
          notes: (e) => {
            const { normalize: n } = e
            return n(['备注'])
          },
          sendDetails: (e) => {
            const { normalize: n } = e
            return n(['发送详情'])
          },
        },
      },
      navigationLayout: (e) => {
        const { normalize: n } = e
        return n(['导航布局'])
      },
      topBarButton: (e) => {
        const { normalize: n } = e
        return n(['顶部按钮'])
      },
      sideBarButton: (e) => {
        const { normalize: n } = e
        return n(['侧边按钮'])
      },
    },
    language: {
      brazilian_portuguese: (e) => {
        const { normalize: n } = e
        return n(['葡萄牙语'])
      },
      english: (e) => {
        const { normalize: n } = e
        return n(['英语'])
      },
      spanish: (e) => {
        const { normalize: n } = e
        return n(['西班牙语'])
      },
      simplified_chinese: (e) => {
        const { normalize: n } = e
        return n(['简体中文'])
      },
      persian: (e) => {
        const { normalize: n } = e
        return n(['波斯语'])
      },
    },
    menu: {
      auth: (e) => {
        const { normalize: n } = e
        return n(['授权'])
      },
      buttons: (e) => {
        const { normalize: n } = e
        return n(['按钮'])
      },
      timelines: (e) => {
        const { normalize: n } = e
        return n(['时间线'])
      },
      dashboard: (e) => {
        const { normalize: n } = e
        return n(['仪表板'])
      },
      billing: (e) => {
        const { normalize: n } = e
        return n(['计费'])
      },
      login: (e) => {
        const { normalize: n } = e
        return n(['登录'])
      },
      signUp: (e) => {
        const { normalize: n } = e
        return n(['注册'])
      },
      preferences: (e) => {
        const { normalize: n } = e
        return n(['偏好'])
      },
      payments: (e) => {
        const { normalize: n } = e
        return n(['支付'])
      },
      'pricing-plans': (e) => {
        const { normalize: n } = e
        return n(['定价计划'])
      },
      'login-singup': (e) => {
        const { normalize: n } = e
        return n(['登录/注册'])
      },
      404: (e) => {
        const { normalize: n } = e
        return n(['404 页面'])
      },
      faq: (e) => {
        const { normalize: n } = e
        return n(['常见问题解答'])
      },
    },
    messages: {
      all: (e) => {
        const { normalize: n } = e
        return n(['查看所有消息'])
      },
      new: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['来自 ', r(o('name')), ' 的新消息'])
      },
      mark_as_read: (e) => {
        const { normalize: n } = e
        return n(['标记为已读'])
      },
    },
    navbar: {
      messageUs: (e) => {
        const { normalize: n } = e
        return n(['需要Web开发帮助吗？请联系我们。'])
      },
      repository: (e) => {
        const { normalize: n } = e
        return n(['GitHub 仓库'])
      },
    },
    notifications: {
      all: (e) => {
        const { normalize: n } = e
        return n(['查看所有通知'])
      },
      mark_as_read: (e) => {
        const { normalize: n } = e
        return n(['标为已读'])
      },
      sentMessage: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n([r(o('name')), ' 给你发了一条消息'])
      },
      uploadedZip: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n([r(o('name')), ' 上传了一个新的 Zip 文件 ', r(o('type'))])
      },
      startedTopic: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n([r(o('name')), ' 开始了一个新话题'])
      },
    },
    user: {
      language: (e) => {
        const { normalize: n } = e
        return n(['修改语言'])
      },
      logout: (e) => {
        const { normalize: n } = e
        return n(['登出'])
      },
      logout: (e) => {
        const { normalize: n } = e
        return n(['登出'])
      },
      profile: (e) => {
        const { normalize: n } = e
        return n(['我的资料'])
      },
      settings: (e) => {
        const { normalize: n } = e
        return n(['设置'])
      },
      billing: (e) => {
        const { normalize: n } = e
        return n(['账单'])
      },
      faq: (e) => {
        const { normalize: n } = e
        return n(['常见问题'])
      },
      helpAndSupport: (e) => {
        const { normalize: n } = e
        return n(['帮助与支持'])
      },
      projects: (e) => {
        const { normalize: n } = e
        return n(['项目'])
      },
      account: (e) => {
        const { normalize: n } = e
        return n(['账户'])
      },
      explore: (e) => {
        const { normalize: n } = e
        return n(['探索'])
      },
    },
    treeView: {
      basic: (e) => {
        const { normalize: n } = e
        return n(['基本型'])
      },
      icons: (e) => {
        const { normalize: n } = e
        return n(['图标'])
      },
      selectable: (e) => {
        const { normalize: n } = e
        return n(['可选择'])
      },
      editable: (e) => {
        const { normalize: n } = e
        return n(['可编辑'])
      },
      advanced: (e) => {
        const { normalize: n } = e
        return n(['高级'])
      },
    },
    chat: {
      title: (e) => {
        const { normalize: n } = e
        return n(['聊天'])
      },
    },
    cards: {
      cards: (e) => {
        const { normalize: n } = e
        return n(['卡片'])
      },
      fixed: (e) => {
        const { normalize: n } = e
        return n(['固定的'])
      },
      floating: (e) => {
        const { normalize: n } = e
        return n(['浮动的'])
      },
      contentText: (e) => {
        const { normalize: n } = e
        return n(['独特的斑马条纹使它们成为人们最熟悉的动物之一。'])
      },
      rowHeight: (e) => {
        const { normalize: n } = e
        return n(['行高'])
      },
      title: {
        dark: (e) => {
          const { normalize: n } = e
          return n(['暗色背景'])
        },
        bright: (e) => {
          const { normalize: n } = e
          return n(['亮色卡片'])
        },
        titleOnImageNoOverlay: (e) => {
          const { normalize: n } = e
          return n(['图像上的标题，但没有叠加'])
        },
        normal: (e) => {
          const { normalize: n } = e
          return n(['标准卡'])
        },
        overlayAndTextOnImage: (e) => {
          const { normalize: n } = e
          return n(['图像上有覆盖和文本的卡片'])
        },
        stripeNoImage: (e) => {
          const { normalize: n } = e
          return n(['无图像条纹卡'])
        },
      },
      button: {
        main: (e) => {
          const { normalize: n } = e
          return n(['主要'])
        },
        cancel: (e) => {
          const { normalize: n } = e
          return n(['取消'])
        },
      },
      link: {
        edit: (e) => {
          const { normalize: n } = e
          return n(['编辑'])
        },
        setAsDefault: (e) => {
          const { normalize: n } = e
          return n(['设为默认'])
        },
        delete: (e) => {
          const { normalize: n } = e
          return n(['删除'])
        },
        traveling: (e) => {
          const { normalize: n } = e
          return n(['Traveling'])
        },
        france: (e) => {
          const { normalize: n } = e
          return n(['法国'])
        },
        review: (e) => {
          const { normalize: n } = e
          return n(['评论'])
        },
        feedback: (e) => {
          const { normalize: n } = e
          return n(['反馈信息'])
        },
        readFull: (e) => {
          const { normalize: n } = e
          return n(['阅读全文'])
        },
        secondaryAction: (e) => {
          const { normalize: n } = e
          return n(['第二行为'])
        },
        action1: (e) => {
          const { normalize: n } = e
          return n(['行为 1'])
        },
        action2: (e) => {
          const { normalize: n } = e
          return n(['行为 2'])
        },
      },
    },
    helpAndSupport: (e) => {
      const { normalize: n } = e
      return n(['帮助与支持'])
    },
    aboutVuesticAdmin: (e) => {
      const { normalize: n } = e
      return n(['关于 Vuestic Admin'])
    },
    search: {
      placeholder: (e) => {
        const { normalize: n } = e
        return n(['搜索...'])
      },
    },
    vuestic: {
      search: (e) => {
        const { normalize: n } = e
        return n(['搜索'])
      },
      noOptions: (e) => {
        const { normalize: n } = e
        return n(['未找到项目'])
      },
      ok: (e) => {
        const { normalize: n } = e
        return n(['确认'])
      },
      cancel: (e) => {
        const { normalize: n } = e
        return n(['取消'])
      },
      uploadFile: (e) => {
        const { normalize: n } = e
        return n(['上传文件'])
      },
      undo: (e) => {
        const { normalize: n } = e
        return n(['撤销'])
      },
      dropzone: (e) => {
        const { normalize: n } = e
        return n(['将文件拖到此处上传'])
      },
      fileDeleted: (e) => {
        const { normalize: n } = e
        return n(['文件已删除'])
      },
      closeAlert: (e) => {
        const { normalize: n } = e
        return n(['关闭警告'])
      },
      backToTop: (e) => {
        const { normalize: n } = e
        return n(['回到顶部'])
      },
      toggleDropdown: (e) => {
        const { normalize: n } = e
        return n(['切换下拉菜单'])
      },
      carousel: (e) => {
        const { normalize: n } = e
        return n(['轮播'])
      },
      goPreviousSlide: (e) => {
        const { normalize: n } = e
        return n(['上一张幻灯片'])
      },
      goNextSlide: (e) => {
        const { normalize: n } = e
        return n(['下一张幻灯片'])
      },
      goSlide: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['跳转到第 ', r(o('index')), ' 张幻灯片'])
      },
      slideOf: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['第 ', r(o('index')), ' 张，共 ', r(o('length')), ' 张'])
      },
      close: (e) => {
        const { normalize: n } = e
        return n(['关闭'])
      },
      openColorPicker: (e) => {
        const { normalize: n } = e
        return n(['打开颜色选择器'])
      },
      colorSelection: (e) => {
        const { normalize: n } = e
        return n(['颜色选择'])
      },
      colorName: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['颜色 ', r(o('color'))])
      },
      decreaseCounter: (e) => {
        const { normalize: n } = e
        return n(['减少计数'])
      },
      increaseCounter: (e) => {
        const { normalize: n } = e
        return n(['增加计数'])
      },
      selectAllRows: (e) => {
        const { normalize: n } = e
        return n(['选择所有行'])
      },
      sortColumnBy: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['按 ', r(o('name')), ' 排序'])
      },
      selectRowByIndex: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['选择第 ', r(o('index')), ' 行'])
      },
      resetDate: (e) => {
        const { normalize: n } = e
        return n(['重置日期'])
      },
      nextPeriod: (e) => {
        const { normalize: n } = e
        return n(['下一个时间段'])
      },
      switchView: (e) => {
        const { normalize: n } = e
        return n(['切换视图'])
      },
      previousPeriod: (e) => {
        const { normalize: n } = e
        return n(['上一个时间段'])
      },
      removeFile: (e) => {
        const { normalize: n } = e
        return n(['删除文件'])
      },
      reset: (e) => {
        const { normalize: n } = e
        return n(['重置'])
      },
      pagination: (e) => {
        const { normalize: n } = e
        return n(['分页'])
      },
      goToTheFirstPage: (e) => {
        const { normalize: n } = e
        return n(['跳转到第一页'])
      },
      goToPreviousPage: (e) => {
        const { normalize: n } = e
        return n(['跳转到上一页'])
      },
      goToSpecificPage: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['跳转到第 ', r(o('page')), ' 页'])
      },
      goToSpecificPageInput: (e) => {
        const { normalize: n } = e
        return n(['输入页码以跳转'])
      },
      goNextPage: (e) => {
        const { normalize: n } = e
        return n(['跳转到下一页'])
      },
      goLastPage: (e) => {
        const { normalize: n } = e
        return n(['跳转到最后一页'])
      },
      currentRating: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['当前评分 ', r(o('value')), ' / ', r(o('max'))])
      },
      voteRating: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['评分 ', r(o('value')), ' / ', r(o('max'))])
      },
      optionsFilter: (e) => {
        const { normalize: n } = e
        return n(['选项筛选'])
      },
      splitPanels: (e) => {
        const { normalize: n } = e
        return n(['分割面板'])
      },
      movePaginationLeft: (e) => {
        const { normalize: n } = e
        return n(['分页向左移动'])
      },
      movePaginationRight: (e) => {
        const { normalize: n } = e
        return n(['分页向右移动'])
      },
      resetTime: (e) => {
        const { normalize: n } = e
        return n(['重置时间'])
      },
      closeToast: (e) => {
        const { normalize: n } = e
        return n(['关闭提示'])
      },
      selectedOption: (e) => {
        const { normalize: n } = e
        return n(['已选选项'])
      },
      noSelectedOption: (e) => {
        const { normalize: n } = e
        return n(['未选择选项'])
      },
      breadcrumbs: (e) => {
        const { normalize: n } = e
        return n(['面包屑导航'])
      },
      counterValue: (e) => {
        const { normalize: n } = e
        return n(['计数值'])
      },
      selectedDate: (e) => {
        const { normalize: n } = e
        return n(['选择的日期'])
      },
      selectedTime: (e) => {
        const { normalize: n } = e
        return n(['选择的时间'])
      },
      progressState: (e) => {
        const { normalize: n } = e
        return n(['进度状态'])
      },
      color: (e) => {
        const { normalize: n } = e
        return n(['颜色'])
      },
      next: (e) => {
        const { normalize: n } = e
        return n(['下一步'])
      },
      back: (e) => {
        const { normalize: n } = e
        return n(['上一步'])
      },
      finish: (e) => {
        const { normalize: n } = e
        return n(['完成'])
      },
      step: (e) => {
        const { normalize: n } = e
        return n(['步骤'])
      },
      progress: (e) => {
        const { normalize: n } = e
        return n(['进度'])
      },
      loading: (e) => {
        const { normalize: n } = e
        return n(['加载中'])
      },
      sliderValue: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['当前滑块值为 ', r(o('value'))])
      },
      switch: (e) => {
        const { normalize: n } = e
        return n(['切换'])
      },
      inputField: (e) => {
        const { normalize: n } = e
        return n(['输入框'])
      },
      fileTypeIncorrect: (e) => {
        const { normalize: n } = e
        return n(['文件类型不正确'])
      },
      select: (e) => {
        const { normalize: n } = e
        return n(['选择一个选项'])
      },
    },
  },
  Pe = Object.freeze(Object.defineProperty({ __proto__: null, default: Re }, Symbol.toStringTag, { value: 'Module' })),
  Fe = {
    auth: {
      agree: (e) => {
        const { normalize: n } = e
        return n(['I agree to'])
      },
      createAccount: (e) => {
        const { normalize: n } = e
        return n(['Create account'])
      },
      createNewAccount: (e) => {
        const { normalize: n } = e
        return n(['Create New Account'])
      },
      email: (e) => {
        const { normalize: n } = e
        return n(['Email'])
      },
      login: (e) => {
        const { normalize: n } = e
        return n(['Login'])
      },
      password: (e) => {
        const { normalize: n } = e
        return n(['Password'])
      },
      recover_password: (e) => {
        const { normalize: n } = e
        return n(['Recover password'])
      },
      sign_up: (e) => {
        const { normalize: n } = e
        return n(['Sign Up'])
      },
      keep_logged_in: (e) => {
        const { normalize: n } = e
        return n(['Keep me logged in'])
      },
      termsOfUse: (e) => {
        const { normalize: n } = e
        return n(['Terms of Use.'])
      },
      reset_password: (e) => {
        const { normalize: n } = e
        return n(['Reset password'])
      },
    },
    404: {
      title: (e) => {
        const { normalize: n } = e
        return n(['This page’s gone fishing.'])
      },
      text: (e) => {
        const { normalize: n } = e
        return n(['If you feel that it’s not right, please send us a message at '])
      },
      back_button: (e) => {
        const { normalize: n } = e
        return n(['Back to dashboard'])
      },
    },
    typography: {
      primary: (e) => {
        const { normalize: n } = e
        return n(['Primary text styles'])
      },
      secondary: (e) => {
        const { normalize: n } = e
        return n(['Secondary text styles'])
      },
    },
    dashboard: {
      versions: (e) => {
        const { normalize: n } = e
        return n(['Versions'])
      },
      setupRemoteConnections: (e) => {
        const { normalize: n } = e
        return n(['Setup Remote Connections'])
      },
      currentVisitors: (e) => {
        const { normalize: n } = e
        return n(['Current Visitors'])
      },
      navigationLayout: (e) => {
        const { normalize: n } = e
        return n(['navigation layout'])
      },
      topBarButton: (e) => {
        const { normalize: n } = e
        return n(['Top Bar'])
      },
      sideBarButton: (e) => {
        const { normalize: n } = e
        return n(['Side Bar'])
      },
    },
    language: {
      brazilian_portuguese: (e) => {
        const { normalize: n } = e
        return n(['Português'])
      },
      english: (e) => {
        const { normalize: n } = e
        return n(['English'])
      },
      spanish: (e) => {
        const { normalize: n } = e
        return n(['Spanish'])
      },
      simplified_chinese: (e) => {
        const { normalize: n } = e
        return n(['Simplified Chinese'])
      },
      persian: (e) => {
        const { normalize: n } = e
        return n(['Persian'])
      },
    },
    menu: {
      auth: (e) => {
        const { normalize: n } = e
        return n(['Auth'])
      },
      buttons: (e) => {
        const { normalize: n } = e
        return n(['Buttons'])
      },
      timelines: (e) => {
        const { normalize: n } = e
        return n(['Timelines'])
      },
      dashboard: (e) => {
        const { normalize: n } = e
        return n(['Dashboard'])
      },
      billing: (e) => {
        const { normalize: n } = e
        return n(['Billing'])
      },
      login: (e) => {
        const { normalize: n } = e
        return n(['Login'])
      },
      preferences: (e) => {
        const { normalize: n } = e
        return n(['Account preferences'])
      },
      payments: (e) => {
        const { normalize: n } = e
        return n(['Payments'])
      },
      settings: (e) => {
        const { normalize: n } = e
        return n(['Application settings'])
      },
      'pricing-plans': (e) => {
        const { normalize: n } = e
        return n(['Pricing plans'])
      },
      'payment-methods': (e) => {
        const { normalize: n } = e
        return n(['Payment methods'])
      },
      signup: (e) => {
        const { normalize: n } = e
        return n(['Signup'])
      },
      'recover-password': (e) => {
        const { normalize: n } = e
        return n(['Recover password'])
      },
      'recover-password-email': (e) => {
        const { normalize: n } = e
        return n(['Recover password email'])
      },
      404: (e) => {
        const { normalize: n } = e
        return n(['404'])
      },
      faq: (e) => {
        const { normalize: n } = e
        return n(['FAQ'])
      },
      users: (e) => {
        const { normalize: n } = e
        return n(['Users'])
      },
      projects: (e) => {
        const { normalize: n } = e
        return n(['Projects'])
      },
    },
    messages: {
      all: (e) => {
        const { normalize: n } = e
        return n(['See all messages'])
      },
      new: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['New messages from ', r(o('name'))])
      },
      mark_as_read: (e) => {
        const { normalize: n } = e
        return n(['Mark As Read'])
      },
    },
    navbar: {
      messageUs: (e) => {
        const { normalize: n } = e
        return n(['Web development inquiries:'])
      },
      repository: (e) => {
        const { normalize: n } = e
        return n(['GitHub Repo'])
      },
    },
    notifications: {
      all: (e) => {
        const { normalize: n } = e
        return n(['See all notifications'])
      },
      less: (e) => {
        const { normalize: n } = e
        return n(['See less notifications'])
      },
      mark_as_read: (e) => {
        const { normalize: n } = e
        return n(['Mark as read'])
      },
      sentMessage: (e) => {
        const { normalize: n } = e
        return n(['sent you a message'])
      },
      uploadedZip: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['uploaded a new Zip file with ', r(o('type'))])
      },
      startedTopic: (e) => {
        const { normalize: n } = e
        return n(['started a new topic'])
      },
    },
    user: {
      language: (e) => {
        const { normalize: n } = e
        return n(['Change language'])
      },
      logout: (e) => {
        const { normalize: n } = e
        return n(['Logout'])
      },
      profile: (e) => {
        const { normalize: n } = e
        return n(['Profile'])
      },
      settings: (e) => {
        const { normalize: n } = e
        return n(['Settings'])
      },
      billing: (e) => {
        const { normalize: n } = e
        return n(['Billing'])
      },
      faq: (e) => {
        const { normalize: n } = e
        return n(['FAQ'])
      },
      helpAndSupport: (e) => {
        const { normalize: n } = e
        return n(['Help & support'])
      },
      projects: (e) => {
        const { normalize: n } = e
        return n(['Projects'])
      },
      account: (e) => {
        const { normalize: n } = e
        return n(['Account'])
      },
      explore: (e) => {
        const { normalize: n } = e
        return n(['Explore'])
      },
    },
    treeView: {
      basic: (e) => {
        const { normalize: n } = e
        return n(['Basic'])
      },
      icons: (e) => {
        const { normalize: n } = e
        return n(['Icons'])
      },
      selectable: (e) => {
        const { normalize: n } = e
        return n(['Selectable'])
      },
      editable: (e) => {
        const { normalize: n } = e
        return n(['Editable'])
      },
      advanced: (e) => {
        const { normalize: n } = e
        return n(['Advanced'])
      },
    },
    chat: {
      title: (e) => {
        const { normalize: n } = e
        return n(['Chat'])
      },
      sendButton: (e) => {
        const { normalize: n } = e
        return n(['Send'])
      },
    },
    spacingPlayground: {
      value: (e) => {
        const { normalize: n } = e
        return n(['Value'])
      },
      margin: (e) => {
        const { normalize: n } = e
        return n(['Margin'])
      },
      padding: (e) => {
        const { normalize: n } = e
        return n(['Padding'])
      },
    },
    spacing: {
      title: (e) => {
        const { normalize: n } = e
        return n(['Spacing'])
      },
    },
    cards: {
      cards: (e) => {
        const { normalize: n } = e
        return n(['Cards'])
      },
      fixed: (e) => {
        const { normalize: n } = e
        return n(['Fixed'])
      },
      floating: (e) => {
        const { normalize: n } = e
        return n(['Floating'])
      },
      contentText: (e) => {
        const { normalize: n } = e
        return n(['The unique stripes of zebras make them one of the animals most familiar to people.'])
      },
      contentTextLong: (e) => {
        const { normalize: n } = e
        return n([
          "The unique stripes of zebras make them one of the animals most familiar to people. They occur in a variety of habitats, such as grasslands, savannas, woodlands, thorny scrublands, mountains, and coastal hills. Various anthropogenic factors have had a severe impact on zebra populations, in particular hunting for skins and habitat destruction. Grévy's zebra and the mountain zebra are endangered. While plains zebras are much more plentiful, one subspecies, the quagga.",
        ])
      },
      rowHeight: (e) => {
        const { normalize: n } = e
        return n(['Row height'])
      },
      title: {
        default: (e) => {
          const { normalize: n } = e
          return n(['Default'])
        },
        withControls: (e) => {
          const { normalize: n } = e
          return n(['With controls'])
        },
        customHeader: (e) => {
          const { normalize: n } = e
          return n(['Custom header'])
        },
        withoutHeader: (e) => {
          const { normalize: n } = e
          return n(['Without header'])
        },
        withImage: (e) => {
          const { normalize: n } = e
          return n(['With Image'])
        },
        withTitleOnImage: (e) => {
          const { normalize: n } = e
          return n(['With title on image'])
        },
        withCustomTitleOnImage: (e) => {
          const { normalize: n } = e
          return n(['With custom title on image'])
        },
        withStripe: (e) => {
          const { normalize: n } = e
          return n(['With stripe'])
        },
        withBackground: (e) => {
          const { normalize: n } = e
          return n(['With background'])
        },
      },
      button: {
        main: (e) => {
          const { normalize: n } = e
          return n(['Main'])
        },
        cancel: (e) => {
          const { normalize: n } = e
          return n(['Cancel'])
        },
        showMore: (e) => {
          const { normalize: n } = e
          return n(['Show More'])
        },
        readMore: (e) => {
          const { normalize: n } = e
          return n(['Show More'])
        },
      },
      link: {
        edit: (e) => {
          const { normalize: n } = e
          return n(['Edit'])
        },
        setAsDefault: (e) => {
          const { normalize: n } = e
          return n(['Set as default'])
        },
        delete: (e) => {
          const { normalize: n } = e
          return n(['Delete'])
        },
        traveling: (e) => {
          const { normalize: n } = e
          return n(['Traveling'])
        },
        france: (e) => {
          const { normalize: n } = e
          return n(['France'])
        },
        review: (e) => {
          const { normalize: n } = e
          return n(['Review'])
        },
        feedback: (e) => {
          const { normalize: n } = e
          return n(['Leave feedback'])
        },
        readFull: (e) => {
          const { normalize: n } = e
          return n(['Read full article'])
        },
        secondaryAction: (e) => {
          const { normalize: n } = e
          return n(['Secondary action'])
        },
        action1: (e) => {
          const { normalize: n } = e
          return n(['Action 1'])
        },
        action2: (e) => {
          const { normalize: n } = e
          return n(['Action 2'])
        },
      },
    },
    colors: {
      themeColors: (e) => {
        const { normalize: n } = e
        return n(['Theme Colors'])
      },
      extraColors: (e) => {
        const { normalize: n } = e
        return n(['Extra Colors'])
      },
      gradients: {
        basic: {
          title: (e) => {
            const { normalize: n } = e
            return n(['Button Gradients'])
          },
        },
        hovered: {
          title: (e) => {
            const { normalize: n } = e
            return n(['Hovered Button Gradients'])
          },
          text: (e) => {
            const { normalize: n } = e
            return n(['Lighten 15% applied to an original style (gradient or flat color) for hover state.'])
          },
        },
        pressed: {
          title: (e) => {
            const { normalize: n } = e
            return n(['Pressed Button Gradients'])
          },
          text: (e) => {
            const { normalize: n } = e
            return n(['Darken 15% applied to an original style (gradient or flat color) for pressed state.'])
          },
        },
      },
    },
    tabs: {
      alignment: (e) => {
        const { normalize: n } = e
        return n(['Tabs alignment'])
      },
      overflow: (e) => {
        const { normalize: n } = e
        return n(['Tabs overflow'])
      },
      hidden: (e) => {
        const { normalize: n } = e
        return n(['Tabs with hidden slider'])
      },
      grow: (e) => {
        const { normalize: n } = e
        return n(['Tabs grow'])
      },
    },
    helpAndSupport: (e) => {
      const { normalize: n } = e
      return n(['Help & support'])
    },
    aboutVuesticAdmin: (e) => {
      const { normalize: n } = e
      return n(['About Vuestic Admin'])
    },
    supportAndConsulting: (e) => {
      const { normalize: n } = e
      return n(['Support & Consulting'])
    },
    search: {
      placeholder: (e) => {
        const { normalize: n } = e
        return n(['Search...'])
      },
    },
    buttonSelect: {
      dark: (e) => {
        const { normalize: n } = e
        return n(['Dark'])
      },
      light: (e) => {
        const { normalize: n } = e
        return n(['Light'])
      },
    },
    vuestic: {
      search: (e) => {
        const { normalize: n } = e
        return n(['Search'])
      },
      noOptions: (e) => {
        const { normalize: n } = e
        return n(['Items not found'])
      },
      ok: (e) => {
        const { normalize: n } = e
        return n(['OK'])
      },
      cancel: (e) => {
        const { normalize: n } = e
        return n(['Cancel'])
      },
      uploadFile: (e) => {
        const { normalize: n } = e
        return n(['Upload file'])
      },
      undo: (e) => {
        const { normalize: n } = e
        return n(['Undo'])
      },
      dropzone: (e) => {
        const { normalize: n } = e
        return n(['Drop files here to upload'])
      },
      fileDeleted: (e) => {
        const { normalize: n } = e
        return n(['File deleted'])
      },
      closeAlert: (e) => {
        const { normalize: n } = e
        return n(['close alert'])
      },
      backToTop: (e) => {
        const { normalize: n } = e
        return n(['back to top'])
      },
      toggleDropdown: (e) => {
        const { normalize: n } = e
        return n(['toggle dropdown'])
      },
      carousel: (e) => {
        const { normalize: n } = e
        return n(['carousel'])
      },
      goPreviousSlide: (e) => {
        const { normalize: n } = e
        return n(['go previous slide'])
      },
      goNextSlide: (e) => {
        const { normalize: n } = e
        return n(['go next slide'])
      },
      goSlide: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['go slide ', r(o('index'))])
      },
      slideOf: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['slide ', r(o('index')), ' of ', r(o('length'))])
      },
      close: (e) => {
        const { normalize: n } = e
        return n(['close'])
      },
      openColorPicker: (e) => {
        const { normalize: n } = e
        return n(['open color picker'])
      },
      colorSelection: (e) => {
        const { normalize: n } = e
        return n(['color selection'])
      },
      colorName: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['color ', r(o('color'))])
      },
      decreaseCounter: (e) => {
        const { normalize: n } = e
        return n(['decrease counter'])
      },
      increaseCounter: (e) => {
        const { normalize: n } = e
        return n(['increase counter'])
      },
      selectAllRows: (e) => {
        const { normalize: n } = e
        return n(['select all rows'])
      },
      sortColumnBy: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['sort column by ', r(o('name'))])
      },
      selectRowByIndex: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['select row ', r(o('index'))])
      },
      resetDate: (e) => {
        const { normalize: n } = e
        return n(['reset date'])
      },
      nextPeriod: (e) => {
        const { normalize: n } = e
        return n(['next period'])
      },
      switchView: (e) => {
        const { normalize: n } = e
        return n(['switch view'])
      },
      previousPeriod: (e) => {
        const { normalize: n } = e
        return n(['previous period'])
      },
      removeFile: (e) => {
        const { normalize: n } = e
        return n(['remove file'])
      },
      reset: (e) => {
        const { normalize: n } = e
        return n(['reset'])
      },
      pagination: (e) => {
        const { normalize: n } = e
        return n(['pagination'])
      },
      goToTheFirstPage: (e) => {
        const { normalize: n } = e
        return n(['go to the first page'])
      },
      goToPreviousPage: (e) => {
        const { normalize: n } = e
        return n(['go to the previous page'])
      },
      goToSpecificPage: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['go to the ', r(o('page')), ' page'])
      },
      goToSpecificPageInput: (e) => {
        const { normalize: n } = e
        return n(['enter the page number to go'])
      },
      goNextPage: (e) => {
        const { normalize: n } = e
        return n(['go next page'])
      },
      goLastPage: (e) => {
        const { normalize: n } = e
        return n(['go last page'])
      },
      currentRating: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['current rating ', r(o('value')), ' of ', r(o('max'))])
      },
      voteRating: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['vote rating ', r(o('value')), ' of ', r(o('max'))])
      },
      optionsFilter: (e) => {
        const { normalize: n } = e
        return n(['options filter'])
      },
      splitPanels: (e) => {
        const { normalize: n } = e
        return n(['split panels'])
      },
      movePaginationLeft: (e) => {
        const { normalize: n } = e
        return n(['move pagination left'])
      },
      movePaginationRight: (e) => {
        const { normalize: n } = e
        return n(['move pagination right'])
      },
      resetTime: (e) => {
        const { normalize: n } = e
        return n(['reset time'])
      },
      closeToast: (e) => {
        const { normalize: n } = e
        return n(['close toast'])
      },
      selectedOption: (e) => {
        const { normalize: n } = e
        return n(['Selected option'])
      },
      noSelectedOption: (e) => {
        const { normalize: n } = e
        return n(['Option is not selected'])
      },
      breadcrumbs: (e) => {
        const { normalize: n } = e
        return n(['breadcrumbs'])
      },
      counterValue: (e) => {
        const { normalize: n } = e
        return n(['counter value'])
      },
      selectedDate: (e) => {
        const { normalize: n } = e
        return n(['selected date'])
      },
      selectedTime: (e) => {
        const { normalize: n } = e
        return n(['selected time'])
      },
      progressState: (e) => {
        const { normalize: n } = e
        return n(['progress state'])
      },
      color: (e) => {
        const { normalize: n } = e
        return n(['color'])
      },
      next: (e) => {
        const { normalize: n } = e
        return n(['Next'])
      },
      back: (e) => {
        const { normalize: n } = e
        return n(['Previous'])
      },
      finish: (e) => {
        const { normalize: n } = e
        return n(['Finish'])
      },
      step: (e) => {
        const { normalize: n } = e
        return n(['step'])
      },
      progress: (e) => {
        const { normalize: n } = e
        return n(['progress'])
      },
      loading: (e) => {
        const { normalize: n } = e
        return n(['Loading'])
      },
      sliderValue: (e) => {
        const { normalize: n, interpolate: r, named: o } = e
        return n(['Current slider value is ', r(o('value'))])
      },
      switch: (e) => {
        const { normalize: n } = e
        return n(['Switch'])
      },
      inputField: (e) => {
        const { normalize: n } = e
        return n(['Input field'])
      },
      fileTypeIncorrect: (e) => {
        const { normalize: n } = e
        return n(['File type is incorrect'])
      },
      select: (e) => {
        const { normalize: n } = e
        return n(['Select an option'])
      },
    },
    Dashboard: (e) => {
      const { normalize: n } = e
      return n(['Dashboard'])
    },
    'Our Journey': (e) => {
      const { normalize: n } = e
      return n(['Our Journey'])
    },
    'Love Notes': (e) => {
      const { normalize: n } = e
      return n(['Love Notes'])
    },
    Settings: (e) => {
      const { normalize: n } = e
      return n(['Settings'])
    },
  },
  je = Object.freeze(Object.defineProperty({ __proto__: null, default: Fe }, Symbol.toStringTag, { value: 'Module' })),
  Me = Object.assign({ './locales/cn.json': Pe, './locales/gb.json': je }),
  te = {}
Object.entries(Me)
  .map(([e, n]) => {
    const r = e.split('/')
    return [r[r.length - 1].split('.json')[0], n.default]
  })
  .forEach((e) => {
    te[e[0]] = e[1]
  })
const Ue = Ve({ locale: 'gb', fallbackLocale: 'gb', messages: te }),
  We = xe(),
  He = 'modulepreload',
  qe = function (e) {
    return '/' + e
  },
  G = {},
  S = function (n, r, o) {
    let t = Promise.resolve()
    if (r && r.length > 0) {
      document.getElementsByTagName('link')
      const a = document.querySelector('meta[property=csp-nonce]'),
        z = (a == null ? void 0 : a.nonce) || (a == null ? void 0 : a.getAttribute('nonce'))
      t = Promise.allSettled(
        r.map((c) => {
          if (((c = qe(c)), c in G)) return
          G[c] = !0
          const _ = c.endsWith('.css'),
            d = _ ? '[rel="stylesheet"]' : ''
          if (document.querySelector(`link[href="${c}"]${d}`)) return
          const u = document.createElement('link')
          if (
            ((u.rel = _ ? 'stylesheet' : He),
            _ || (u.as = 'script'),
            (u.crossOrigin = ''),
            (u.href = c),
            z && u.setAttribute('nonce', z),
            document.head.appendChild(u),
            _)
          )
            return new Promise((f, l) => {
              ;(u.addEventListener('load', f),
                u.addEventListener('error', () => l(new Error(`Unable to preload CSS for ${c}`))))
            })
        }),
      )
    }
    function i(a) {
      const z = new Event('vite:preloadError', { cancelable: !0 })
      if (((z.payload = a), window.dispatchEvent(z), !z.defaultPrevented)) throw a
    }
    return t.then((a) => {
      for (const z of a || []) z.status === 'rejected' && i(z.reason)
      return n().catch(i)
    })
  },
  Je = { class: 'h-full flex items-center justify-center mx-auto max-w-[420px]' },
  Ge = { class: 'p-4' },
  Ke = { class: 'h-full flex flex-row items-center justify-start mx-auto max-w-[420px]' },
  Qe = { class: 'flex flex-col items-start' },
  Ze = V({
    __name: 'AuthLayout',
    setup(e) {
      const n = K()
      return (r, o) => {
        const t = N('RouterLink'),
          i = N('RouterView'),
          a = Q
        return b(n).lgUp
          ? (p(),
            w(
              a,
              { key: 0, class: 'h-screen bg-[var(--va-background-secondary)]' },
              {
                left: m(() => [
                  s(
                    t,
                    {
                      class: 'bg-primary h-full flex items-center justify-center',
                      style: { width: '35vw' },
                      to: '/',
                      'aria-label': 'Visit homepage',
                    },
                    {
                      default: m(
                        () => o[0] || (o[0] = [g('div', { class: 'text-white text-4xl font-bold' }, 'Love App', -1)]),
                      ),
                      _: 1,
                    },
                  ),
                ]),
                content: m(() => [g('main', Je, [s(i)])]),
                _: 1,
              },
            ))
          : (p(),
            w(
              a,
              { key: 1, class: 'h-screen bg-[var(--va-background-secondary)]' },
              {
                content: m(() => [
                  g('div', Ge, [
                    g('main', Ke, [
                      g('div', Qe, [
                        s(
                          t,
                          { class: 'py-4', to: '/', 'aria-label': 'Visit homepage' },
                          {
                            default: m(
                              () =>
                                o[1] ||
                                (o[1] = [g('div', { class: 'text-primary text-2xl font-bold mb-2' }, 'Love App', -1)]),
                            ),
                            _: 1,
                          },
                        ),
                        s(i),
                      ]),
                    ]),
                  ]),
                ]),
                _: 1,
              },
            ))
      }
    },
  }),
  J = Z('global', {
    state: () => ({ isSidebarMinimized: !1 }),
    actions: {
      toggleSidebar() {
        this.isSidebarMinimized = !this.isSidebarMinimized
      },
    },
  }),
  Xe = {
    class: 'va-icon-menu-collapsed',
    height: '24',
    viewBox: '0 0 24 24',
    width: '24',
    xmlns: 'http://www.w3.org/2000/svg',
  },
  Ye = { fill: 'none', 'fill-rule': 'nonzero' },
  en = ['fill'],
  nn = ['fill'],
  on = ['fill'],
  rn = V({
    __name: 'VaIconMenuCollapsed',
    props: { color: { default: 'inherit' } },
    setup(e) {
      return (n, r) => (
        p(),
        k('svg', Xe, [
          g('g', Ye, [
            r[0] || (r[0] = g('path', { d: 'M0 0h24v24H0z' }, null, -1)),
            g('rect', { fill: n.color, height: '2', rx: '1', width: '20', x: '2', y: '3' }, null, 8, en),
            g(
              'path',
              {
                fill: n.color,
                d: 'M3 11h10a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2zM20.993 11l-2.7-2.7-1.414 1.414L18.164 11H16a1 1 0 0 0 0 2h2.179l-1.3 1.3 1.414 1.414L21.007 13A1 1 0 0 0 21 11h-.007z',
              },
              null,
              8,
              nn,
            ),
            g('rect', { fill: n.color, height: '2', rx: '1', width: '20', x: '2', y: '19' }, null, 8, on),
          ]),
        ])
      )
    },
  }),
  U = {
    root: { name: '/', displayName: 'navigationRoutes.home' },
    routes: [
      { name: 'love-dashboard', displayName: 'Dashboard', meta: { icon: 'dashboard' } },
      { name: 'love-timeline', displayName: 'Our Journey', meta: { icon: 'timeline' } },
      { name: 'love-messages', displayName: 'Love Notes', meta: { icon: 'favorite' } },
      { name: 'love-settings', displayName: 'Settings', meta: { icon: 'settings' } },
    ],
  },
  tn = { class: 'flex gap-2' },
  an = { class: 'flex items-center' },
  ln = V({
    __name: 'AppLayoutNavigation',
    setup(e) {
      const { isSidebarMinimized: n } = q(J()),
        r = ee(),
        o = ne(),
        { t } = oe(),
        i = (d) => {
          const u = (f) => {
            for (const l of f) {
              if (l.name === d) return l.displayName
              if (l.children) {
                const v = u(l.children)
                if (v) return v
              }
            }
            return ''
          }
          return u(U.routes)
        },
        a = C(() => {
          const d = []
          return (
            o.matched.forEach((u) => {
              const f = i(u.name)
              f && d.push({ label: t(f), to: u.path, hasChildren: u.children && u.children.length > 0 })
            }),
            d
          )
        }),
        { getColor: z } = B(),
        c = C(() => z('secondary')),
        _ = (d) => {
          d.hasChildren || r.push(d.to)
        }
      return (d, u) => {
        const f = le,
          l = se
        return (
          p(),
          k('div', tn, [
            s(
              rn,
              {
                class: re(['cursor-pointer', { 'x-flip': !b(n) }]),
                color: c.value,
                onClick: u[0] || (u[0] = (v) => (n.value = !b(n))),
              },
              null,
              8,
              ['class', 'color'],
            ),
            g('nav', an, [
              s(l, null, {
                default: m(() => [
                  s(f, { label: 'Home', to: { name: 'love-dashboard' } }),
                  (p(!0),
                  k(
                    j,
                    null,
                    M(
                      a.value,
                      (v) => (
                        p(),
                        w(f, { key: v.label, label: v.label, onClick: (y) => _(v) }, null, 8, ['label', 'onClick'])
                      ),
                    ),
                    128,
                  )),
                ]),
                _: 1,
              }),
            ]),
          ])
        )
      }
    },
  }),
  O = (e, n) => {
    const r = e.__vccOpts || e
    for (const [o, t] of n) r[o] = t
    return r
  },
  sn = O(ln, [['__scopeId', 'data-v-6a89f68a']]),
  mn = '/logo.svg',
  cn = { class: 'profile-dropdown-wrapper' },
  un = { class: 'profile-dropdown__anchor min-w-max flex items-center' },
  zn = { key: 0 },
  dn = V({
    __name: 'ProfileDropdown',
    setup(e) {
      const { colors: n, setHSLAColor: r } = B(),
        o = C(() => r(n.focus, { a: 0.1 })),
        t = T(),
        i = ee(),
        a = I(!1),
        z = () => {
          ;((a.value = !1), i.push({ name: 'love-profile' }))
        },
        c = () => {
          ;((a.value = !1), t.logout(), i.push({ name: 'login' }))
        }
      return (_, d) => {
        const u = pe,
          f = H,
          l = W,
          v = ze,
          y = de,
          x = ue,
          h = ce,
          R = me
        return (
          p(),
          k('div', cn, [
            s(
              R,
              {
                modelValue: a.value,
                'onUpdate:modelValue': d[0] || (d[0] = (ie) => (a.value = ie)),
                offset: [9, 0],
                class: 'profile-dropdown',
                'stick-to-edges': '',
              },
              {
                anchor: m(() => [
                  s(
                    f,
                    { preset: 'secondary', color: 'textPrimary' },
                    {
                      default: m(() => [
                        g('span', un, [
                          Ae(_.$slots, 'default'),
                          (p(),
                          w(
                            u,
                            { key: b(t).pfp, size: 32, color: 'warning', src: b(t).pfp || void 0, class: 'ml-2' },
                            { default: m(() => [b(t).pfp ? A('', !0) : (p(), k('span', zn, '👤'))]), _: 1 },
                            8,
                            ['src'],
                          )),
                        ]),
                      ]),
                      _: 3,
                    },
                  ),
                ]),
                default: m(() => [
                  s(
                    h,
                    {
                      class: 'profile-dropdown__content md:w-60 px-0 py-4 w-full',
                      style: Ie({ '--hover-color': o.value }),
                    },
                    {
                      default: m(() => [
                        s(x, null, {
                          default: m(() => [
                            s(
                              v,
                              { class: 'menu-item px-4 text-base cursor-pointer h-8', onClick: z },
                              {
                                default: m(() => [
                                  s(l, { name: 'account_circle', class: 'pr-1', color: 'secondary' }),
                                  d[1] || (d[1] = $(' Profile ')),
                                ]),
                                _: 1,
                              },
                            ),
                            s(y, { class: 'mx-3 my-2' }),
                            s(
                              v,
                              { class: 'menu-item px-4 text-base cursor-pointer h-8', onClick: c },
                              {
                                default: m(() => [
                                  s(l, { name: 'logout', class: 'pr-1', color: 'secondary' }),
                                  d[2] || (d[2] = $(' Logout ')),
                                ]),
                                _: 1,
                              },
                            ),
                          ]),
                          _: 1,
                        }),
                      ]),
                      _: 1,
                    },
                    8,
                    ['style'],
                  ),
                ]),
                _: 3,
              },
              8,
              ['modelValue'],
            ),
          ])
        )
      }
    },
  }),
  pn = { class: 'app-navbar-actions' },
  _n = V({
    __name: 'AppNavbarActions',
    props: { isMobile: { type: Boolean, default: !1 } },
    setup(e) {
      const n = T(),
        r = () => {
          const o = n.preferences.theme === 'dark' ? 'light' : 'dark'
          n.updatePreferences({ theme: o })
        }
      return (o, t) => {
        const i = H
        return (
          p(),
          k('div', pn, [
            s(
              i,
              {
                preset: 'secondary',
                color: 'primary',
                class: 'app-navbar-actions__item',
                icon: b(n).preferences.theme === 'dark' ? 'light_mode' : 'dark_mode',
                onClick: r,
              },
              null,
              8,
              ['icon'],
            ),
            s(dn, { class: 'app-navbar-actions__item app-navbar-actions__item--profile mr-1' }),
          ])
        )
      }
    },
  }),
  gn = { class: 'left' },
  hn = { class: 'app-navbar__emoji flex-shrink-0' },
  fn = { class: 'app-navbar__title font-bold text-primary truncate sm:whitespace-nowrap' },
  vn = V({
    __name: 'AppNavbar',
    props: { isMobile: { type: Boolean, default: !1 } },
    setup(e) {
      const n = J(),
        r = T(),
        { isSidebarMinimized: o } = q(n)
      return (t, i) => {
        const a = W,
          z = N('RouterLink'),
          c = _e
        return (
          p(),
          w(
            c,
            { class: 'app-layout-navbar py-2 px-0' },
            {
              left: m(() => [
                g('div', gn, [
                  e.isMobile
                    ? (p(),
                      w(
                        Te,
                        { key: 0, name: 'icon-fade', mode: 'out-in' },
                        {
                          default: m(() => [
                            s(
                              a,
                              {
                                color: 'primary',
                                name: b(o) ? 'menu' : 'close',
                                size: '24px',
                                style: { 'margin-top': '3px' },
                                onClick: i[0] || (i[0] = (_) => (o.value = !b(o))),
                              },
                              null,
                              8,
                              ['name'],
                            ),
                          ]),
                          _: 1,
                        },
                      ))
                    : A('', !0),
                  s(
                    z,
                    {
                      to: '/',
                      'aria-label': 'Visit home page',
                      class: 'flex items-center gap-1 sm:gap-2 overflow-hidden',
                    },
                    {
                      default: m(() => [
                        i[1] ||
                          (i[1] = g(
                            'img',
                            { src: mn, alt: 'Logo', class: 'app-navbar__logo flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8' },
                            null,
                            -1,
                          )),
                        g('span', hn, E(b(r).preferences.appEmoji), 1),
                        g('span', fn, E(b(r).preferences.appName), 1),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
              ]),
              right: m(() => [
                s(_n, { class: 'app-navbar__actions', 'is-mobile': e.isMobile }, null, 8, ['is-mobile']),
              ]),
              _: 1,
            },
          )
        )
      }
    },
  }),
  bn = O(vn, [['__scopeId', 'data-v-a27dd319']]),
  yn = V({
    name: 'Sidebar',
    props: { visible: { type: Boolean, default: !0 }, mobile: { type: Boolean, default: !1 } },
    emits: ['update:visible'],
    setup: (e, { emit: n }) => {
      const { getColor: r, colorToRgba: o } = B(),
        t = ne(),
        { t: i } = oe(),
        a = I([]),
        z = C({ get: () => e.visible, set: (h) => n('update:visible', h) }),
        c = (h) => t.name === h.name,
        _ = (h) =>
          h.children ? h.children.some(({ name: R }) => t.path.endsWith(`${R}`)) : t.path.endsWith(`${h.name}`),
        d = () => (a.value = U.routes.map((h) => _(h))),
        u = C(() => (e.mobile ? '100vw' : '220px')),
        f = C(() => r('background-secondary')),
        l = C(() => o(r('focus'), 0.1)),
        v = (h) => (_(h) ? 'primary' : 'secondary'),
        y = (h) => (_(h) ? 'primary' : 'textPrimary'),
        x = (h) => (h ? 'va-arrow-up' : 'va-arrow-down')
      return (
        Y(() => t.fullPath, d, { immediate: !0 }),
        {
          writableVisible: z,
          sidebarWidth: u,
          value: a,
          color: f,
          activeColor: l,
          navigationRoutes: U,
          routeHasActiveChild: _,
          isActiveChildRoute: c,
          t: i,
          iconColor: v,
          textColor: y,
          arrowDirection: x,
        }
      )
    },
  })
function wn(e, n, r, o, t, i) {
  const a = W,
    z = be,
    c = ve,
    _ = fe,
    d = he,
    u = ge,
    f = ye
  return (
    p(),
    w(
      f,
      {
        modelValue: e.writableVisible,
        'onUpdate:modelValue': n[1] || (n[1] = (l) => (e.writableVisible = l)),
        width: e.sidebarWidth,
        color: e.color,
        'minimized-width': '0',
      },
      {
        default: m(() => [
          s(
            u,
            { modelValue: e.value, 'onUpdate:modelValue': n[0] || (n[0] = (l) => (e.value = l)), multiple: '' },
            {
              default: m(() => [
                (p(!0),
                k(
                  j,
                  null,
                  M(
                    e.navigationRoutes.routes,
                    (l, v) => (
                      p(),
                      w(
                        d,
                        { key: v },
                        {
                          header: m(({ value: y }) => [
                            s(
                              _,
                              {
                                to: l.children ? void 0 : { name: l.name },
                                active: e.routeHasActiveChild(l),
                                'active-color': e.activeColor,
                                'text-color': e.textColor(l),
                                'aria-label': `${l.children ? 'Open category ' : 'Visit'} ${e.t(l.displayName)}`,
                                role: 'button',
                                'hover-opacity': '0.10',
                              },
                              {
                                default: m(() => [
                                  s(
                                    c,
                                    { class: 'py-2.5 pr-2 pl-4' },
                                    {
                                      default: m(() => [
                                        l.meta.icon
                                          ? (p(),
                                            w(
                                              a,
                                              {
                                                key: 0,
                                                'aria-hidden': 'true',
                                                name: l.meta.icon,
                                                size: '18px',
                                                color: e.iconColor(l),
                                              },
                                              null,
                                              8,
                                              ['name', 'color'],
                                            ))
                                          : A('', !0),
                                        s(
                                          z,
                                          {
                                            class: 'flex justify-between items-center leading-5 font-semibold text-sm',
                                          },
                                          {
                                            default: m(() => [
                                              $(E(e.t(l.displayName)) + ' ', 1),
                                              l.children
                                                ? (p(),
                                                  w(a, { key: 0, name: e.arrowDirection(y), size: '18px' }, null, 8, [
                                                    'name',
                                                  ]))
                                                : A('', !0),
                                            ]),
                                            _: 2,
                                          },
                                          1024,
                                        ),
                                      ]),
                                      _: 2,
                                    },
                                    1024,
                                  ),
                                ]),
                                _: 2,
                              },
                              1032,
                              ['to', 'active', 'active-color', 'text-color', 'aria-label'],
                            ),
                          ]),
                          body: m(() => [
                            (p(!0),
                            k(
                              j,
                              null,
                              M(
                                l.children,
                                (y, x) => (
                                  p(),
                                  k('div', { key: x }, [
                                    s(
                                      _,
                                      {
                                        to: { name: y.name },
                                        active: e.isActiveChildRoute(y),
                                        'active-color': e.activeColor,
                                        'text-color': e.textColor(y),
                                        'aria-label': `Visit ${e.t(l.displayName)}`,
                                        'hover-opacity': '0.10',
                                      },
                                      {
                                        default: m(() => [
                                          s(
                                            c,
                                            { class: 'py-2.5 pr-2 pl-11' },
                                            {
                                              default: m(() => [
                                                s(
                                                  z,
                                                  { class: 'leading-5 font-semibold text-sm' },
                                                  { default: m(() => [$(E(e.t(y.displayName)), 1)]), _: 2 },
                                                  1024,
                                                ),
                                              ]),
                                              _: 2,
                                            },
                                            1024,
                                          ),
                                        ]),
                                        _: 2,
                                      },
                                      1032,
                                      ['to', 'active', 'active-color', 'text-color', 'aria-label'],
                                    ),
                                  ])
                                ),
                              ),
                              128,
                            )),
                          ]),
                          _: 2,
                        },
                        1024,
                      )
                    ),
                  ),
                  128,
                )),
              ]),
              _: 1,
            },
            8,
            ['modelValue'],
          ),
        ]),
        _: 1,
      },
      8,
      ['modelValue', 'width', 'color'],
    )
  )
}
const Sn = O(yn, [['render', wn]]),
  kn = { key: 0, class: 'flex justify-end' },
  Cn = { class: 'p-4 pt-0 w-full' },
  Vn = { class: 'w-full' },
  xn = {
    __name: 'AppLayout',
    setup(e) {
      const n = J(),
        r = T(),
        o = K(),
        t = I('16rem'),
        i = I(void 0),
        a = I(!1),
        z = I(!1),
        { isSidebarMinimized: c } = q(n),
        _ = () => {
          ;((c.value = o.mdDown),
            (a.value = o.smDown),
            (z.value = o.mdDown),
            (i.value = a.value ? '0' : '4.5rem'),
            (t.value = z.value ? '100%' : '16rem'))
        }
      ;(X(() => {
        ;(window.addEventListener('resize', _), _(), r.checkAuth())
      }),
        Ne(() => {
          window.removeEventListener('resize', _)
        }),
        Le(() => {
          o.mdDown && (c.value = !0)
        }))
      const d = C(() => z.value && !c.value),
        u = () => {
          c.value = !0
        }
      return (f, l) => {
        const v = H,
          y = N('RouterView'),
          x = Q
        return (
          p(),
          w(
            x,
            {
              top: { fixed: !0, order: 2 },
              left: { fixed: !0, absolute: b(o).mdDown, order: 1, overlay: b(o).mdDown && !b(c) },
              onLeftOverlayClick: l[0] || (l[0] = (h) => (c.value = !0)),
            },
            {
              top: m(() => [s(bn, { 'is-mobile': a.value }, null, 8, ['is-mobile'])]),
              left: m(() => [
                s(Sn, { minimized: b(c), animated: !a.value, mobile: a.value }, null, 8, [
                  'minimized',
                  'animated',
                  'mobile',
                ]),
              ]),
              content: m(() => [
                g(
                  'div',
                  { class: re([{ minimized: b(c) }, 'app-layout__sidebar-wrapper']) },
                  [
                    d.value
                      ? (p(),
                        k('div', kn, [s(v, { class: 'px-4 py-4', icon: 'md_close', preset: 'plain', onClick: u })]))
                      : A('', !0),
                  ],
                  2,
                ),
                a.value ? A('', !0) : (p(), w(sn, { key: 0, class: 'p-4' })),
                g('main', Cn, [g('article', Vn, [s(y)])]),
              ]),
              _: 1,
            },
            8,
            ['left'],
          )
        )
      }
    },
  },
  In = O(xn, [['__scopeId', 'data-v-0cac25d4']]),
  An = [
    {
      name: 'admin',
      path: '/',
      component: In,
      redirect: { name: 'love-dashboard' },
      meta: { requiresAuth: !0 },
      children: [
        {
          name: 'love-dashboard',
          path: 'love/dashboard',
          component: () =>
            S(() => import('./LoveDashboard-BMglu6Ui.js'), __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])),
        },
        {
          name: 'love-timeline',
          path: 'love/timeline',
          component: () => S(() => import('./LoveTimeline-BIJg47ol.js'), __vite__mapDeps([10, 1, 2, 3, 4, 8, 11])),
        },
        {
          name: 'love-messages',
          path: 'love/messages',
          component: () => S(() => import('./LoveMessages-CBbr7pyl.js'), __vite__mapDeps([12, 1, 2, 3, 4, 5, 6, 13])),
        },
        {
          name: 'love-profile',
          path: 'love/profile',
          component: () => S(() => import('./LoveProfile-CgrzggU4.js'), __vite__mapDeps([14, 1, 2, 3, 4, 7, 15])),
        },
        {
          name: 'love-pairing',
          path: 'love/pairing',
          component: () => S(() => import('./LovePairing-BdYYqM7p.js'), __vite__mapDeps([16, 1, 2, 3, 4, 15, 17])),
        },
        {
          name: 'love-settings',
          path: 'love/settings',
          component: () => S(() => import('./LoveSettings-DegUIPPK.js'), __vite__mapDeps([18, 1, 2, 3, 4, 7])),
        },
      ],
    },
    {
      path: '/auth',
      component: Ze,
      children: [
        {
          name: 'login',
          path: 'login',
          component: () => S(() => import('./Login-Djkdg_kn.js'), __vite__mapDeps([19, 1, 2, 3, 4])),
        },
        {
          name: 'signup',
          path: 'signup',
          component: () => S(() => import('./Signup-CFOH8iRV.js'), __vite__mapDeps([20, 1, 2, 3, 4])),
        },
        {
          name: 'recover-password',
          path: 'recover-password',
          component: () => S(() => import('./RecoverPassword-CNWFQfQE.js'), __vite__mapDeps([21, 1, 2, 3, 4])),
        },
        {
          name: 'recover-password-email',
          path: 'recover-password-email',
          component: () => S(() => import('./CheckTheEmail-FwfkFGzL.js'), __vite__mapDeps([22, 1, 2, 3, 4])),
        },
        { path: '', redirect: { name: 'login' } },
      ],
    },
    {
      name: '404',
      path: '/404',
      component: () => S(() => import('./404-CyiAwkBD.js'), __vite__mapDeps([23, 1, 2, 3, 4])),
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'love-dashboard' } },
  ],
  ae = $e({
    history: Ee('/'),
    scrollBehavior(e, n, r) {
      if (r) return r
      if (e.hash) return { el: e.hash, behavior: 'smooth' }
      window.scrollTo(0, 0)
    },
    routes: An,
  })
ae.beforeEach(async (e, n, r) => {
  const o = T(),
    t = e.matched.some((i) => i.meta.requiresAuth)
  if (t && !o.token) r({ name: 'login' })
  else {
    if (o.token && !o.id && (await o.checkAuth(), !o.id)) {
      r({ name: 'login' })
      return
    }
    if (t && !o.partnerId && e.name !== 'love-pairing' && e.name !== 'love-profile') {
      r({ name: 'love-pairing' })
      return
    }
    if (e.name === 'love-pairing' && o.partnerId) {
      r({ name: 'love-dashboard' })
      return
    }
    r()
  }
})
const Tn = [
    { name: 'angle_down', to: 'fa4-angle-down' },
    { name: 'angle_up', to: 'fa4-angle-up' },
    { name: 'bell', to: 'fa4-bell' },
    { name: 'bell_slash', to: 'fa4-bell-slash' },
    { name: 'cogs', to: 'fa4-cogs' },
    { name: 'envelope', to: 'fa4-envelope' },
    { name: 'eye', to: 'fa4-eye' },
    { name: 'gear', to: 'fa4-gear' },
    { name: 'map', to: 'fa4-map' },
    { name: 'map_marker', to: 'fa4-map-marker' },
    { name: 'music', to: 'fa4-music' },
    { name: 'print', to: 'fa4-print' },
    { name: 'refresh', to: 'fa4-refresh' },
    { name: 'search', to: 'fa4-search' },
    { name: 'mars', to: 'fa4-mars' },
    { name: 'venus', to: 'fa4-venus' },
    { name: 'volume_off', to: 'fa4-volume-off' },
    { name: 'volume_up', to: 'fa4-volume-up' },
    { name: 'github', to: 'fa4-github' },
    { name: 'md_close', to: 'ion-md-close' },
    { name: 'images', to: 'ion-md-images' },
    { name: 'list', to: 'ion-md-list' },
    { name: 'musical_notes', to: 'ion-md-musical-notes' },
    { name: 'star_outline', to: 'ion-md-star-outline' },
    { name: 'grid', to: 'ion-md-grid' },
    { name: 'help', to: 'ion-md-help' },
    { name: 'key', to: 'ion-md-key' },
  ],
  Nn = we({
    aliases: Tn,
    fonts: [
      { name: 'fa4-{code}', resolve: ({ code: e }) => ({ class: `fa4 fa fa-${e}` }) },
      { name: 'ion-{font}-{code}', resolve: ({ font: e, code: n }) => ({ class: `icon ion-${e}-${n}` }) },
      {
        name: 'flag-icon-{code} {size}',
        resolve: ({ code: e, size: n }) => ({ class: `fi fi-${e} fi-size-${n}`, tag: 'span' }),
      },
      {
        name: /(brandico|entypo|fa|fontelico|glyphicon|iconicstroke|maki|openwebicons)-(.*)/,
        resolveFromRegex: (e, n) => ({ class: `${e} ${e}-${n}` }),
      },
      { name: 'material-icons-{code}', resolve: ({ code: e }) => ({ to: e }) },
      { name: 'mso-{content}', class: 'material-symbols-outlined', resolve: ({ content: e }) => ({ content: e }) },
    ],
  }),
  Ln = {
    presets: {
      light: {
        backgroundPrimary: '#F4F6F8',
        backgroundSecondary: '#FFFFFF',
        backgroundCardPrimary: '#F7F9F9',
        backgroundCardSecondary: '#ECFDE6',
        success: '#228200',
        info: '#158DE3',
        danger: '#E42222',
        warning: '#FFD43A',
      },
      dark: {
        backgroundPrimary: '#0F172A',
        backgroundSecondary: '#1E293B',
        backgroundCardPrimary: '#111827',
        backgroundCardSecondary: '#1E293B',
        backgroundElement: '#334155',
        backgroundBorder: '#334155',
        textPrimary: '#F1F5F9',
        textInverted: '#0F172A',
        primary: '#3B82F6',
        success: '#22C55E',
        info: '#3ABFF8',
        danger: '#F87171',
        warning: '#FBBF24',
      },
    },
  },
  $n = Se({
    colors: Ln,
    icons: Nn,
    breakpoint: { enabled: !0, bodyClass: !0, thresholds: { xs: 0, sm: 320, md: 640, lg: 1024, xl: 1440 } },
    components: {
      VaIcon: { sizesConfig: { defaultSize: 19, sizes: { small: 14, medium: 19, large: 26 } } },
      VaModal: { mobileFullscreen: !1, maxHeight: 'calc(100% - 2rem)' },
      VaPagination: { activeButtonProps: { preset: 'primary' } },
      VaDataTable: { disableClientSideSorting: !0 },
      presets: {
        VaSelect: {
          small: {
            class: 'va-select--small',
            keepAnchorWidth: !1,
            placement: 'bottom-end',
            width: 'min(100%, 150px)',
            style:
              '--va-input-wrapper-min-height: 24px; --va-input-wrapper-border-radius: 2px; --va-input-wrapper-width: 100px;',
          },
        },
      },
    },
  }),
  L = Be(Oe).use(ke())
L.use(Ce({ config: $n }))
L.use(We)
L.use(ae)
L.use(Ue)
L.mount('#app')
export { S as _, O as a, P as b, On as g, F as p, T as u }
//# sourceMappingURL=index-D_419K7i.js.map
