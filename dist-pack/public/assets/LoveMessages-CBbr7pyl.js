import { x as Z, F as ee, j as se, B as ae, z as te, k as oe, h as le } from './vuestic-ui-hYeKHxJy.js'
import {
  k as ne,
  r as i,
  a as U,
  G as re,
  q as x,
  C as o,
  L as r,
  F as ce,
  D as ue,
  d as b,
  n as C,
  c as A,
  t as k,
  V as ie,
  w,
  K as de,
  o as m,
  u as c,
  x as D,
  W as E,
  v as j,
} from './vue-vendor-CS4KimFI.js'
import { u as me, a as pe } from './index-D_419K7i.js'
import { u as ve, m as _, T as fe } from './message.service-0pLRvHXE.js'
import './vendor-Qzk3SZgC.js'
const ge = { class: 'love-messages flex flex-col relative overflow-hidden h-full min-h-screen' },
  he = { class: 'absolute top-4 right-4 z-30' },
  ye = { class: 'flex flex-col p-4 pb-24' },
  xe = { class: 'message-info flex items-center justify-end gap-2 mt-1' },
  _e = { class: 'message-time text-[0.65rem] opacity-70' },
  be = { key: 0, class: 'flex gap-2 opacity-60' },
  Ce = { class: 'input-area-wrapper fixed bottom-0 left-0 w-full px-4 pb-4 z-[100] pointer-events-none' },
  ke = {
    class: 'input-area px-3 rounded-2xl pointer-events-auto bg-transparent',
    style: { minHeight: '52px', maxWidth: '800px', margin: '0 auto' },
  },
  we = { class: 'p-4' },
  Ve = { class: 'flex justify-end gap-2 pt-6' },
  Te = ne({
    __name: 'LoveMessages',
    setup(Be) {
      const t = me(),
        { isColorLight: K } = ve(),
        { init: u } = Z(),
        { confirm: P } = ee(),
        p = i([]),
        l = i(''),
        n = i(null),
        f = i(null),
        v = i(!1),
        g = i(t.preferences.noteTheme),
        h = i(t.preferences.noteBubbleColor),
        $ = U(() => t.preferences.noteTheme),
        H = U(() => ({})),
        W = () => {
          ;((g.value = t.preferences.noteTheme), (h.value = t.preferences.noteBubbleColor), (v.value = !0))
        },
        q = () => {
          try {
            ;(t.updatePreferences({ noteTheme: g.value, noteBubbleColor: h.value }),
              (v.value = !1),
              u({ message: 'Theme updated successfully!', color: 'success' }))
          } catch {
            u({ message: 'Failed to save background', color: 'danger' })
          }
        },
        y = async () => {
          try {
            const s = await _.getAll()
            s.length !== p.value.length && ((p.value = s), T())
          } catch (s) {
            console.error(s)
          }
        },
        V = async () => {
          if (l.value.trim()) {
            if (n.value) {
              try {
                await _.update(n.value, l.value)
                const s = p.value.findIndex((a) => a.id === n.value)
                ;(s !== -1 && (p.value[s].content = l.value),
                  (l.value = ''),
                  (n.value = null),
                  u({ message: 'Message updated', color: 'success' }))
              } catch {
                u({ message: 'Failed to update message', color: 'danger' })
              }
              return
            }
            try {
              ;(await _.create(l.value), (l.value = ''), y())
            } catch {
              u({ message: 'Failed to send message', color: 'danger' })
            }
          }
        },
        G = (s) => {
          ;((l.value = s.content), (n.value = s.id))
        },
        J = () => {
          ;((l.value = ''), (n.value = null))
        },
        O = async (s) => {
          if (await P('Delete this message?'))
            try {
              ;(await _.delete(s), y(), u({ message: 'Message deleted', color: 'success' }))
            } catch {
              u({ message: 'Failed to delete message', color: 'danger' })
            }
        },
        T = (s = 'smooth') => {
          de(() => {
            f.value && f.value.scrollTo({ top: f.value.scrollHeight, behavior: s })
          })
        }
      return (
        re(() => {
          ;(y(), T('auto'), setInterval(y, 3e3))
        }),
        (s, a) => {
          const d = se,
            Q = oe,
            B = le,
            R = ae,
            X = te
          return (
            m(),
            x('div', ge, [
              o('div', he, [
                r(d, { icon: 'palette', round: '', size: 'small', class: 'opacity-80 hover:opacity-100', onClick: W }),
              ]),
              o(
                'div',
                {
                  ref_key: 'messagesContainer',
                  ref: f,
                  class: C(['messages-container flex-grow w-full overflow-y-auto', $.value]),
                  style: b(H.value),
                },
                [
                  o('div', ye, [
                    (m(!0),
                    x(
                      ce,
                      null,
                      ue(p.value, (e) => {
                        var M, S, z, N, I, F, L
                        return (
                          m(),
                          x(
                            'div',
                            {
                              key: e.id,
                              class: C([
                                'message-wrapper',
                                ((M = e.Sender) == null ? void 0 : M.username) === c(t).userName
                                  ? 'my-message-wrapper'
                                  : 'other-message-wrapper',
                              ]),
                            },
                            [
                              ((S = e.Sender) == null ? void 0 : S.username) !== c(t).userName
                                ? (m(),
                                  A(
                                    Q,
                                    {
                                      key: 0,
                                      src: (z = e.Sender) == null ? void 0 : z.avatarUrl,
                                      size: 'small',
                                      class: 'mr-2 mb-1',
                                    },
                                    null,
                                    8,
                                    ['src'],
                                  ))
                                : k('', !0),
                              o(
                                'div',
                                {
                                  class: C([
                                    'message-bubble group',
                                    ((N = e.Sender) == null ? void 0 : N.username) === c(t).userName
                                      ? 'my-message'
                                      : 'other-message',
                                  ]),
                                  style: b(
                                    ((I = e.Sender) == null ? void 0 : I.username) === c(t).userName
                                      ? { backgroundColor: c(t).preferences.noteBubbleColor }
                                      : {},
                                  ),
                                },
                                [
                                  o(
                                    'div',
                                    {
                                      class: 'message-text',
                                      style: b(
                                        ((F = e.Sender) == null ? void 0 : F.username) === c(t).userName &&
                                          c(K)(c(t).preferences.noteBubbleColor)
                                          ? { color: '#333' }
                                          : {},
                                      ),
                                    },
                                    D(e.content),
                                    5,
                                  ),
                                  o('div', xe, [
                                    o(
                                      'div',
                                      _e,
                                      D(
                                        new Date(e.createdAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        }),
                                      ),
                                      1,
                                    ),
                                    ((L = e.Sender) == null ? void 0 : L.username) === c(t).userName
                                      ? (m(),
                                        x('div', be, [
                                          r(
                                            B,
                                            {
                                              name: 'edit',
                                              size: 'small',
                                              class: 'cursor-pointer hover:text-white',
                                              style: { 'font-size': '14px' },
                                              onClick: E((Y) => G(e), ['stop']),
                                            },
                                            null,
                                            8,
                                            ['onClick'],
                                          ),
                                          r(
                                            B,
                                            {
                                              name: 'delete',
                                              size: 'small',
                                              class: 'cursor-pointer hover:text-red-200',
                                              style: { 'font-size': '14px' },
                                              onClick: E((Y) => O(e.id), ['stop']),
                                            },
                                            null,
                                            8,
                                            ['onClick'],
                                          ),
                                        ]))
                                      : k('', !0),
                                  ]),
                                ],
                                6,
                              ),
                            ],
                            2,
                          )
                        )
                      }),
                      128,
                    )),
                  ]),
                ],
                6,
              ),
              o('div', Ce, [
                o('div', ke, [
                  r(
                    R,
                    {
                      modelValue: l.value,
                      'onUpdate:modelValue': a[0] || (a[0] = (e) => (l.value = e)),
                      placeholder: n.value ? 'Edit message...' : 'Type a sweet message...',
                      class: 'flex-grow custom-message-input',
                      style: {
                        '--va-input-text-color': '#000000',
                        '--va-input-placeholder-color': '#666666',
                        '--va-input-container-background-color': 'transparent',
                        '--va-input-container-border-color': 'rgba(0,0,0,0.1)',
                      },
                      onKeyup: ie(V, ['enter']),
                    },
                    null,
                    8,
                    ['modelValue', 'placeholder'],
                  ),
                  n.value
                    ? (m(), A(d, { key: 0, icon: 'close', round: '', flat: '', color: 'secondary', onClick: J }))
                    : k('', !0),
                  r(d, { icon: n.value ? 'check' : 'send', round: '', onClick: V }, null, 8, ['icon']),
                ]),
              ]),
              r(
                X,
                {
                  modelValue: v.value,
                  'onUpdate:modelValue': a[4] || (a[4] = (e) => (v.value = e)),
                  title: 'Customize Chat Background',
                  'hide-default-actions': '',
                  'max-width': '600px',
                },
                {
                  default: w(() => [
                    o('div', we, [
                      r(
                        fe,
                        {
                          modelValue: g.value,
                          'onUpdate:modelValue': a[1] || (a[1] = (e) => (g.value = e)),
                          'color-value': h.value,
                          'onUpdate:colorValue': a[2] || (a[2] = (e) => (h.value = e)),
                          'pattern-label': 'Select Background Pattern',
                          'color-label': 'Bubble Color',
                        },
                        null,
                        8,
                        ['modelValue', 'color-value'],
                      ),
                      o('div', Ve, [
                        r(
                          d,
                          { preset: 'secondary', onClick: a[3] || (a[3] = (e) => (v.value = !1)) },
                          { default: w(() => a[5] || (a[5] = [j('Cancel')])), _: 1 },
                        ),
                        r(d, { onClick: q }, { default: w(() => a[6] || (a[6] = [j('Save Changes')])), _: 1 }),
                      ]),
                    ]),
                  ]),
                  _: 1,
                },
                8,
                ['modelValue'],
              ),
            ])
          )
        }
      )
    },
  }),
  Fe = pe(Te, [['__scopeId', 'data-v-16c7c713']])
export { Fe as default }
//# sourceMappingURL=LoveMessages-CBbr7pyl.js.map
