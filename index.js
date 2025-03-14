const WebSocket = require('ws');
const { promisify } = require('util');
const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

console.log("\x1b[36m▀█▀ █▀▀ █▄░█ █▀▀ █▀█   █▄▄ █▀█ ▀█▀");
console.log("░█░ ██▄ █░▀█ ██▄ █▄█   █▄█ █▄█ ░█░");
console.log("");
console.log(" █████╗░██████╗░██╗░░░██╗██████╗░████████╗░█████╗░██╗░░██╗░█████╗░███╗░░░███╗");
console.log("██╔══██╗██╔══██╗╚██╗░██╔╝██╔══██╗╚══██╔══╝██╔══██╗██║░██╔╝██╔══██╗████╗░████║");
console.log("██║░░╚═╝██████╔╝░╚████╔╝░██████╔╝░░░██║░░░██║░░██║█████═╝░██║░░██║██╔████╔██║");
console.log("██║░░██╗██╔══██╗░░╚██╔╝░░██╔═══╝░░░░██║░░░██║░░██║██╔═██╗░██║░░██║██║╚██╔╝██║");
console.log("╚█████╔╝██║░░██║░░░██║░░░██║░░░░░░░░██║░░░╚█████╔╝██║░╚██╗╚█████╔╝██║░╚═╝░██║");
console.log("░╚════╝░╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░░░░░░░╚═╝░░░░╚════╝░╚═╝░░╚═╝░╚════╝░╚═╝░░░░░╚═╝");
console.log("");
console.log("                //// JOIN DISCUSSION https://t.me/cryptokom1 ////\n\x1b[0m");

let socket = null;
let pingInterval;
let countdownInterval;
let potentialPoints = 0;
let countdown = "Calculating...";
let pointsTotal = 0;
let pointsToday = 0;
let retryDelay = 1000;

const auth = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";
const reffCode = "OwAG3kib1ivOJG4Y0OCZ8lJETa6ypvsDtGmdhcjB";

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getLocalStorage() {
  try {
    const data = await readFileAsync('localStorage.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function setLocalStorage(data) {
  const currentData = await getLocalStorage();
  const newData = { ...currentData, ...data };
  await writeFileAsync('localStorage.json', JSON.stringify(newData));
}

async function connectWebSocket(token, proxy) {
  if (socket) return;
  const version = "v0.2";
  const url = "wss://secure.ws.teneo.pro";
  const wsUrl = `${url}/websocket?accessToken=${encodeURIComponent(token)}&version=${encodeURIComponent(version)}`;

  const options = {};
  if (proxy) {
    options.agent = new HttpsProxyAgent(proxy);
  }

  socket = new WebSocket(wsUrl, options);

  socket.onopen = async () => {
    const connectionTime = new Date().toISOString();
    await setLocalStorage({ lastUpdated: connectionTime });
    console.log("\nWebSocket connected at", connectionTime, "\n");
    startPinging();
    startCountdownAndPoints();
  };

  socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    console.log("Received message from WebSocket:");

    console.table({
        Points_Total: data.pointsTotal,
        Points_Today: data.pointsToday,
        Last_Updated: new Date().toISOString()
    });

    if (data.pointsTotal !== undefined && data.pointsToday !== undefined) {
        const lastUpdated = new Date().toISOString();
        await setLocalStorage({
            lastUpdated: lastUpdated,
            pointsTotal: data.pointsTotal,
            pointsToday: data.pointsToday,
        });
        pointsTotal = data.pointsTotal;
        pointsToday = data.pointsToday;
    }
};

  let reconnectAttempts = 0;
  socket.onclose = () => {
    socket = null;
    console.log("\nWebSocket disconnected.\n");
    stopPinging();
    const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
    setTimeout(() => connectWebSocket(token, proxy), delay);
    reconnectAttempts++;
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
    stopPinging();
  }
}

function startPinging() {
  stopPinging();
  pingInterval = setInterval(async () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "PING" }));
      await setLocalStorage({ lastPingDate: new Date().toISOString() });
      console.log("\x1b[33m\n📡 Sent Ping...\x1b[0m");
    }
  }, 10000);
}

function stopPinging() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    console.log("\nPinging stopped.\n");
  }
}

process.on('SIGINT', () => {
  console.log('Received SIGINT. Stopping pinging and disconnecting WebSocket...');
  stopPinging();
  disconnectWebSocket();
  process.exit(0);
});

function startCountdownAndPoints() {
  clearInterval(countdownInterval);
  updateCountdownAndPoints();
  countdownInterval = setInterval(updateCountdownAndPoints, 60 * 1000); // 1 minute interval
}

async function updateCountdownAndPoints() {
  const { lastUpdated, pointsTotal, pointsToday } = await getLocalStorage();
  const totalPoints = pointsTotal !== undefined ? pointsTotal : 'Data not available';
  const todayPoints = pointsToday !== undefined ? pointsToday : 'Data not available';
  
  if (lastUpdated) {
    const nextHeartbeat = new Date(lastUpdated);
    nextHeartbeat.setMinutes(nextHeartbeat.getMinutes() + 15);
    const now = new Date();
    const diff = nextHeartbeat.getTime() - now.getTime();

    if (diff > 0) {
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      countdown = `${minutes}m ${seconds}s`;

      const maxPoints = 25;
      const timeElapsed = now.getTime() - new Date(lastUpdated).getTime();
      const timeElapsedMinutes = timeElapsed / (60 * 1000);
      let newPoints = Math.min(maxPoints, (timeElapsedMinutes / 15) * maxPoints);
      newPoints = parseFloat(newPoints.toFixed(2));

      if (Math.random() < 0.1) {
        const bonus = Math.random() * 2;
        newPoints = Math.min(maxPoints, newPoints + bonus);
        newPoints = parseFloat(newPoints.toFixed(2));
      }

      potentialPoints = newPoints;
    } else {
      countdown = "Calculating...";
      potentialPoints = 25;
    }
  } else {
    countdown = "Calculating...";
    potentialPoints = 0;
  }
  console.log("\x1b[32m\nSystem Overview:\x1b[0m");
  console.log("────────────────────────────────");
  console.log(`Total Points   : \x1b[36m${pointsTotal}\x1b[0m`);
console.log(`Points Today   : \x1b[36m${pointsToday}\x1b[0m`);
console.log(`Countdown      : \x1b[36m${countdown}\x1b[0m`);
  console.log("────────────────────────────────\n");
  await setLocalStorage({ potentialPoints, countdown });
}

async function getUserId(proxy) {
  const loginUrl = "https://auth.teneo.pro/api/login";

  rl.question('Email: ', (email) => {
    rl.question('Password: ', async (password) => {
      try {
        const response = await axios.post(loginUrl, {
          email: email,
          password: password
        }, {
          headers: {
            'x-api-key': reffCode
          }
        });

        const access_token = response.data.access_token;

        await setLocalStorage({ access_token });
        await startCountdownAndPoints();
        await connectWebSocket(access_token, proxy);
      } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
      } finally {
        rl.close();
      }
    });
  });
}

async function registerUser() {
  const isExistUrl = 'https://auth.teneo.pro/api/check-user-exists';
  const signupUrl = "https://node-b.teneo.pro/auth/v1/signup";

  rl.question('Enter your email: ', (email) => {
    rl.question('Enter your password: ', (password) => {
      rl.question('Enter invited_by code: ', async (invitedBy) => {
        try {
          const isExist = await axios.post(isExistUrl, { email: email }, {
            headers: {
              'x-api-key': reffCode
            }
          });

          if (isExist && isExist.data && isExist.data.exists) {
            console.log('User already exists, please just login with:', email);
            return;
          } else {
            const response = await axios.post(signupUrl, {
              email: email,
              password: password,
              data: { invited_by: invitedBy },
              gotrue_meta_security: {},
              code_challenge: null,
              code_challenge_method: null
            }, {
              headers: {
                'apikey': auth,
                'Content-Type': 'application/json',
                'authorization': `Bearer ${auth}`,
                'x-client-info': 'supabase-js-web/2.47.10',
                'x-supabase-api-version': '2024-01-01',
              }
            });
          }

          console.log('Registration successful. Please confirm your email at:', email);
        } catch (error) {
          console.error('Error during registration:', error.response ? error.response.data : error.message);
        } finally {
          rl.close();
        }
      });
    });
  });
}

async function main() {
  const localStorageData = await getLocalStorage();
  let access_token = localStorageData.access_token;

  rl.question('Do you want to use a proxy? (y/n): ', async (useProxy) => {
    let proxy = null;
    if (useProxy.toLowerCase() === 'y') {
      proxy = await new Promise((resolve) => {
        rl.question('Please enter your proxy URL (e.g., http://username:password@host:port): ', (inputProxy) => {
          resolve(inputProxy);
        });
      });
    }

    if (!access_token) {
      rl.question('User Token not found. Would you like to:\n1. Register an account\n2. Login to your account\n3. Enter Token manually\nChoose an option: ', async (option) => {
        switch (option) {
          case '1':
            await registerUser();
            break;
          case '2':
            await getUserId(proxy);
            break;
          case '3':
            rl.question('Please enter your access token: ', async (accessToken) => {
              access_token = accessToken;
              await setLocalStorage({ access_token });
              await startCountdownAndPoints();
              await connectWebSocket(access_token, proxy);
              rl.close();
            });
            break;
          default:
            console.log('Invalid option. Exiting...');
            process.exit(0);
        }
      });
    } else {
      rl.question('Menu:\n1. Logout\n2. Start Running Node\nChoose an option: ', async (option) => {
        switch (option) {
          case '1':
            fs.unlink('localStorage.json', (err) => {
              if (err) {
                console.error('Error deleting localStorage.json:', err.message);
              } else {
                console.log('✅Logged out successfully.');
                process.exit(0);
              }
            });
            break;
          case '2':
            await startCountdownAndPoints();
            await connectWebSocket(access_token, proxy);
            break;
          default:
            console.log('Invalid option. Exiting...');
            process.exit(0);
        }
      });
    }
  });
}

// Run
main();
