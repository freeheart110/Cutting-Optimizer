# CuttingOptimizer 📏✂️

**CuttingOptimizer** is a mobile app built with **React Native (Expo)** that helps users plan the most efficient way to cut stock materials into desired lengths, minimizing waste and optimizing material usage.

---

## 🚀 Features

- 🔧 **Linear Cutting Optimization** using both:
  - **FFD (First-Fit Decreasing)** and
  - **BFD (Best-Fit Decreasing)** algorithms.
- 📊 **Dynamic Scoring** that selects the best result based on:
  - Fewer unplaced cuttings
  - Higher material usage rate
  - Fewer stock pieces used
- 📱 **Interactive Input UI**:
  - Add/edit/remove stock lengths and desired cuttings
  - Toggle **Unlimited Stock Mode**
- 📈 **Visual Cutting Plan Reports**
  - Grouped by project
  - Includes detailed charts, usage metrics, and leftover stats
- 🔐 **Authentication** (Firebase Auth)
  - Guest users can use the optimizer
  - Registered users can **save reports**, organize them into **projects**, and access report **history**
- 🧾 **Swipe-to-delete** and **pull-to-refresh** functionality in saved history
- ☁️ **Firebase Firestore** integration for persistent report storage

---

## 🛠 Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Custom bar chart for visualizing cuttings
- **Navigation**: React Navigation
- **UI Icons**: Expo Vector Icons

---

## 🧪 Try It Out

To run the app locally:
Prerequisites:
  Node.js (>=18.x)
  Expo CLI (npm install -g expo-cli)
1. Clone this repo:
   ```bash
   git clone https://github.com/freeheart110/Cutting-Optimizer.git
   cd Cutting-Optimizer
2. Install dependencies:
  npm install
3. Start Expo:
  npx expo start
4. Run the app:

	•	On Mobile:

    •	Install the Expo Go app from Google Play or App Store.

    •	Scan the QR code displayed in your terminal or browser.

	•	On PC :
  
	  › Press a │ open Android

    › Press i │ open iOS simulator
