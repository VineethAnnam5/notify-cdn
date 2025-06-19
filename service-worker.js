// public/service-worker.js

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Teksskillhub Local Update';

  const options = {
    body: data.body || 'You have a new notification!',
    icon: data.icon,
    // This ensures userId, launchUrlId, and the main url are available in notificationclick's e.notification.data
    data: data,
    url: data.url,
    image: data.image
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const payload = e.notification.data || {};
  const userId = payload.userId;
  const launchUrlId = payload.launchUrlId;

  const apiEndpoint = 'http://192.168.1.158:3050/api/pushtokens/updateclick';
  const apiRequestBody = {
    userId: userId,
    hasClicked: true,
    launchUrlId: launchUrlId
  };
  const trackClickPromise = fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(apiRequestBody),
  })
    .then(response => {
      if (!response.ok) {
        console.error('Failed to hit updateclick API:', response.status, response.statusText);
      } else {
        console.log('Updateclick API hit successfully with payload:', apiRequestBody);
      }
      return response;
    })
    .catch(error => {
      console.error('Error hitting updateclick API:', error);
    });
  const openUrlPromise = clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
      return Promise.resolve();
    })
    .catch(error => {
      console.error('Error opening URL:', error);
      return Promise.resolve();
    });
  e.waitUntil(Promise.allSettled([trackClickPromise, openUrlPromise]));
});