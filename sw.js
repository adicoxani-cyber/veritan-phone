/* Veritan — сервис-воркер приложения на телефоне (v1.62).
   Только уведомления: пуш от компьютера (Web Push, зашифрован браузером) →
   показать уведомление + число на значке; нажали — открыть нужную вкладку.
   Страничку не кэширует: она всегда свежая с GitHub Pages.
   Выкладывается на страничку как sw.js (phUploadPage в background.js). */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { t: 'Veritan', b: e.data ? e.data.text() : '' }; }
  var opts = {
    body: String(d.b || ''),
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { tab: String(d.tab || ''), id: String(d.id || ''), k: String(d.k || '') },
    timestamp: +d.at || Date.now()
  };
  if (d.tag) { opts.tag = String(d.tag); opts.renotify = true; }
  var jobs = [self.registration.showNotification(String(d.t || 'Veritan'), opts)];
  // число на значке приложения: новые заказы + новые заявки (по правам устройства)
  if (typeof d.bd === 'number' && self.navigator) {
    try {
      if (d.bd > 0 && self.navigator.setAppBadge) jobs.push(self.navigator.setAppBadge(d.bd));
      else if (d.bd <= 0 && self.navigator.clearAppBadge) jobs.push(self.navigator.clearAppBadge());
    } catch (x) {}
  }
  // открытой страничке — «пришло новое, обнови данные»
  jobs.push(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cl) {
    cl.forEach(function (c) { try { c.postMessage({ vp: 'push', k: d.k || '', tab: d.tab || '' }); } catch (x) {} });
  }));
  e.waitUntil(Promise.all(jobs).catch(function () {}));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var data = e.notification.data || {}, tab = data.tab || '';
  var scope = self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cl) {
    for (var i = 0; i < cl.length; i++) {
      if (cl[i].url.indexOf(scope) === 0) {
        try { cl[i].postMessage({ vp: 'open', tab: tab, id: data.id || '' }); } catch (x) {}
        return cl[i].focus();
      }
    }
    return self.clients.openWindow(scope + (tab ? '#tab=' + tab + (data.id ? '&id=' + encodeURIComponent(data.id) : '') : ''));
  }));
});
