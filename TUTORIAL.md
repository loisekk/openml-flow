# 🧬 OpenML Flow: User Tutorial (Docker Setup & First Pipeline)

Welcome to **OpenML Flow**! This tutorial will guide you through installing the platform on your local machine using Docker, and building your very first visual Machine Learning pipeline.

OpenML Flow is a local-first visual ML IDE. This means **all your data, model training, and code execution happen directly on your machine**—no cloud servers, no subscription fees.

---

## Phase 1: Installation via Docker

Using Docker ensures you don't have to install Python, Node.js, or any complex dependencies manually. 

### Step 1: Install Prerequisites
If you don't have them already, download and install:
1. [**Docker Desktop**](https://www.docker.com/products/docker-desktop/) (Available for Windows, Mac, and Linux)

### Step 2: Create the Launch File
1. Create a new, empty folder on your computer (e.g., `openml-flow`).
2. Inside that folder, create a file named `docker-compose.yml`.
3. Open the file in a text editor and paste the following configuration:

```yaml
services:
  backend:
    image: loisekk/openml-flow-backend:latest
    container_name: openml-flow-backend
    ports:
      - "3001:3001"
    volumes:
      # Mount directories, not files. This prevents the Windows mount bug.
      - ./uploads:/app/uploads
      - ./data:/app/data
    environment:
      - PYTHONUNBUFFERED=1

  frontend:
    image: loisekk/openml-flow-frontend:latest
    container_name: openml-flow-frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
```

### Step 3: Launch the Application
1. Open your terminal (or Command Prompt / PowerShell).
2. Navigate to the folder where you saved `docker-compose.yml`.
3. Run the following command:
   ```bash
   docker-compose up -d
   ```
   *(The `-d` flag runs it in the background. Docker will now download the images and start the platform).*

4. Open your web browser and go to: **http://localhost:8080**

You should see the OpenML Flow login screen! 🎉

---

## Phase 2: Setting Up Your Account

1. On the login screen, click **Register**.
2. Create a username and password. *(Don't worry, this is stored locally on your machine in the `data/openmlpipe.db` file we set up in Docker. It is not sent to any external servers).*
3. Log in with your new credentials. You will arrive at the **Dashboard**.

---

## Phase 3: Building Your First ML Pipeline

Let's build a simple pipeline that loads a dataset, cleans it, and trains a Random Forest model.

### Step 1: Create a Workflow
1. On the Dashboard, click the orange **"+ Create Workflow"** button.
2. You will be taken to the **Studio**—an infinite visual canvas.

### Step 2: Add Nodes to the Canvas
On the left side, you have the **Node Library**. 
1. Click the **Data Loading** category to expand it.
2. Click **Load CSV**. A node will appear on the canvas.
3. Next, expand the **Data Cleaning** category and click **Drop Nulls**.
4. Expand the **Split & Validation** category and click **Train/Test Split**.
5. Finally, expand the **Models** category and click **Random Forest**.

### Step 3: Connect the Nodes
Click and drag from the small dot (output port) on the right side of a node to the input port on the left side of the next node. Connect them in this order:

`Load CSV` ➜ `Drop Nulls` ➜ `Train/Test Split` ➜ `Random Forest`

---

## Phase 4: Uploading Data & Using Node Studio

To make our `Load CSV` node work, we need to give it a dataset.

### Step 1: Upload a Dataset
1. **Double-click** the `Load CSV` node on the canvas. 
2. A floating **Node Studio** window will open. This is your dedicated IDE for this specific node.
3. Click the **Parameters** tab if you aren't already there.
4. Under the **UPLOAD LOCAL DATASET** section, click **Choose File**.
5. Select any `.csv` file from your computer. 
6. Once it says "Selected: your_file.csv", the upload is complete. The file is now stored securely on your local machine.
7. Click the **Code** tab in the Node Studio. You will see that the Python code has automatically updated to read your specific file! 
8. Close the Node Studio window using the **X** in the top right.

### Step 2: Check Dependencies
The `Random Forest` node requires the `scikit-learn` library.
1. Double-click the `Random Forest` node to open its Node Studio.
2. Click the **Environment** tab.
3. Here you will see a list of required packages and whether they are installed. *(Note: `scikit-learn` comes pre-installed in the Docker image, so it should show a green "Ready" checkmark).*
4. Close the Node Studio.

---

## Phase 5: Executing Your Workflow

It's time to run the Python code we just visually generated!

1. In the top right corner of the screen, click the orange **"Execute Workflow ▶"** button.
2. Look at the **Bottom Panel** (specifically the **Console** tab). 
3. You will see real-time Python execution logs streaming in, just like a Jupyter Notebook or terminal.
4. Look at the nodes on the canvas. You will see their borders glow **orange** while running, and turn **green** when they finish successfully!
5. If an error occurs (e.g., your CSV has a formatting issue), the node will turn **red**, and the error message will appear in the console.

---

## Phase 6: Managing Packages & AI Providers (Optional)

OpenML Flow is designed to give you total control over your environment.

### Installing New Python Libraries
Need a library that isn't pre-installed?
1. Click the **⚙️ Settings** icon in the top navigation bar.
2. Ensure you are on the **Environment** tab.
3. In the "Install new package" box, type a package name (e.g., `xgboost`) and click **Install**.
4. The backend will securely run `pip install xgboost` in your Docker container, and it will immediately appear in your installed packages list!

### Adding an AI Assistant
Want the built-in AI Copilot to help you debug your pipeline?
1. Go to **Settings** ➜ **AI Providers**.
2. Fill out the form with your API Key (e.g., from OpenAI or Groq). *Your keys are stored locally in your SQLite database and never exposed to the internet.*
3. Click **Add Provider** and set it as Active.
4. Now, if you open any node's Node Studio and go to the **AI Assistant** tab, you can ask it questions about your specific ML pipeline!

---

### 🧹 Stopping the Application
When you are done working, you can stop the platform by opening your terminal and running:
```bash
docker-compose down
```
Your workflows and datasets are safely saved in your folder. Next time you run `docker-compose up -d`, everything will be exactly as you left it!

**Welcome to OpenML Flow. Happy building! 🚀**
