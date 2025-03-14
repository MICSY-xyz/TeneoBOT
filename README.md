# TeneoBOT

TeneoBOT is a WebSocket-based bot that allows you to interact with the server automatically, calculate points, and manage user data. This project is created to help users easily connect and interact with the Teneo server.

## 🚀 Features
- Automatic WebSocket connection to communicate with the server.
- Real-time calculation and display of **Total Points** and **Points Today**.
- Sending **ping** to the server every 10 seconds to maintain the connection.
- Supports **proxy** usage.
- **Potential points** calculation based on time and the provided algorithm.

## 📋 Prerequisites
- **Node.js** version 16 or higher.
  - TeneoBOT requires Node.js to run the WebSocket server and manage dependencies.
  - For **Termux** users, ensure you install the latest version of Node.js.

## 📱 Installation in Termux
Follow these steps to install and run TeneoBOT on **Termux**:

### 1. Install **Node.js** and **npm**
First, you need to install **Node.js** (which includes **npm**) on Termux:

```
pkg update
pkg upgrade
pkg install nodejs
```

### 2. Clone the Repository
Clone this repository from **GitHub** to your device:

```
git clone https://github.com/MICSY-xyz/TeneoBOT.git
cd TeneoBOT
```

### 3. Install Dependencies

Install the required dependencies using npm

```
npm install
```

#### 4. Run the Bot

After the dependencies are installed, you can run the bot with the following command:

```
node index.js
```

The bot will prompt you to enter user information (such as email and password) for login or registration. Follow the instructions in the terminal to proceed.
