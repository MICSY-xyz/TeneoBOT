# TeneoBOT

TeneoBOT is a WebSocket-based bot that allows you to interact with the server automatically, calculate points, and manage user data. This project is created to help users easily connect and interact with the Teneo server.

## 🚀 Features
- Automatic WebSocket connection to communicate with the server.
- Real-time calculation and display of **Total Points** and **Points Today**.
- Sending **ping** to the server every 10 seconds to maintain the connection.
- Supports **proxy** usage.
- Local data storage using `localStorage.json`.
- **Potential points** calculation based on time and the provided algorithm.

## 📋 Prerequisites
- **Node.js** version 16 or higher.
  - TeneoBOT requires Node.js to run the WebSocket server and manage dependencies.
  - For **Termux** users, ensure you install the latest version of Node.js.

## 📱 Installation in Termux
Follow these steps to install and run TeneoBOT on **Termux**:

### 1. Install **Node.js** and **npm**
First, you need to install **Node.js** (which includes **npm**) on Termux:

```sh
pkg update
pkg upgrade
pkg install nodejs

