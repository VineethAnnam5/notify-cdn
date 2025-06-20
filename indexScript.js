const applicationServerKey = "BJxwPvagi4DFKyvW6Lo7m9f5Sdk8kxb0nMIbUYH4O1FGILXiImy41iHWexG2Kj9dorccY0Y6Z5qv2sf5KPS1Sxc";

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeUser() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      console.log(subscription,"dfsdfsfsdfsdfsdf")
      if (subscription) {
        await sendSubscriptionToBackend(subscription);
        sendWelcomeNotification();
        return;
      }
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(applicationServerKey)
      };
      subscription = await registration.pushManager.subscribe(subscribeOptions);
      await sendSubscriptionToBackend(subscription);
      sendWelcomeNotification(); 
    } catch (error) {
      console.error('Failed to subscribe the user or send subscription to backend:', error);
      if (Notification.permission === 'denied') {
      } else if (error.name === 'NotAllowedError') {
        console.warn('User explicitly denied permission or dismissed prompt.');
      } else {
        console.error('An unexpected error occurred during subscription:', error);
      }
    }
  } else {
    console.warn('Push messaging is not supported in this browser.');
  }
}

async function sendSubscriptionToBackend(subscription) {
  const backendEndpoint = 'http://192.168.1.158:3050/api/pushtokens/saveSubscription';
  const dataToSend = {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: subscription.toJSON().keys.p256dh,
      auth: subscription.toJSON().keys.auth
    },
    hostname: window.location.origin
  };
  try {
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    const responseData = await response.json();
    return responseData; 
  } catch (error) {
    console.error('Error sending subscription to backend:', error);
    throw error; // Re-throw to propagate the error and prevent welcome notification
  }
}

async function sendWelcomeNotification() {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification('Welcome to Teksskillhub!', {
      body: 'Thanks for enabling notifications. We\'ll keep you updated!',
      icon: '/path/to/your/welcome-icon.png', 
      tag: 'welcome-notification'
    });
    console.log('Welcome notification shown.');
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('%PUBLIC_URL%/service-worker.js')
      .then(registration => {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            subscribeUser();
          } else {
            console.warn('Notification permission denied by user (automatic prompt).');
          }
        }).catch(error => {
          console.error('Error requesting notification permission (automatic prompt):', error);
        });

      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
