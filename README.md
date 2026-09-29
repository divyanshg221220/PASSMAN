# PASSMAN — CLI Password Manager & Security Tool

```text
 _______  _______  _______  _______  __   __  _______  __    _
|       ||   _   ||       ||       ||  |_|  ||   _   ||  |  | |
|    _  ||  |_|  ||  _____||  _____||       ||  |_|  ||   |_| |
|   |_| ||       || |_____ | |_____ |       ||       ||       |
|    ___||       ||_____  ||_____  ||       ||       ||  _    |
|   |    |   _   | _____| | _____| || ||_|| ||   _   || | |   |
|___|    |__| |__||_______||_______||_|   |_||__| |__||_|  |__|
```

**PASSMAN** is an interactive, privacy-focused Python Command-Line Interface (CLI) security tool. It provides offline password breach checking against known compromised password datasets, mathematically computes password entropy, generates cryptographically strong passwords, and provides instant strength assessments—all with **zero network dependencies** and **zero external package requirements**.

---

## 🚀 Key Features

* **🛡️ Password Breach Checker**: Instantly verifies if a password exists within a local database of commonly leaked passwords (`Common passwords.txt`).
* **🎲 Secure Password Generator**: Creates random passwords based on customizable criteria (length, uppercase, lowercase, numbers, special characters). Automatically ensures generated passwords are non-compromised.
* **📊 Entropy-Based Strength Calculator**: Evaluates password resilience using real mathematical entropy ($E = L \times \log_2 N$) rather than superficial pattern rules.
* **🎨 Interactive Color-Coded Terminal UI**: Features a menu-driven interface with clear visual feedback (Red for compromised/weak, Yellow for medium, Green for safe/strong).
* **🔒 100% Offline & Private**: Runs entirely on your local machine with zero external HTTP requests, ensuring credentials are never exposed.

---

## 🧮 How Entropy Scoring Works

Unlike basic regex checkers that only look for character inclusion (e.g., "must contain a digit and symbol"), PASSMAN measures password strength through **information entropy in bits**.

The formula used is:
$$E = L \times \log_2(N)$$

Where:
* **$L$** = Length of the password.
* **$N$** = Total pool size of character sets present in the password:
  * Lowercase letters (`a-z`): $+26$
  * Uppercase letters (`A-Z`): $+26$
  * Digits (`0-9`): $+10$
  * Special characters / Punctuation: $+32$

### Strength Rating Scale

| Entropy (Bits) | Strength Rating | Visual Indicator | Search Space Complexity |
| :--- | :--- | :--- | :--- |
| **< 28 bits** | **Very Weak** | 🔴 Red | High vulnerability to brute-force attacks |
| **28 – 35 bits** | **Weak** | 🔴 Red | Low brute-force resistance |
| **36 – 59 bits** | **Medium** | 🟡 Yellow | Moderate protection against online guessing |
| **60 – 126 bits** | **Strong** | 🟢 Green | High resistance to offline cracking |
| **≥ 127 bits** | **Very Strong** | 🟢 Green | Cryptographic grade security |

---

## 📋 Prerequisites

* **Python 3.6+** installed on your system.
* Standard Python modules used: `random`, `math`, `string` (built-in, no `pip install` required).

---

## 🛠️ Quick Start & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/divyanshg221220/PASSMAN-PASSWORD-MANAGER.git
   cd PASSMAN-PASSWORD-MANAGER
   ```

2. **Run PASSMAN**:
   ```bash
   python passman.py
   ```

---

## 💻 Usage & Menu Options

Launch `passman.py` to open the main interactive menu:

```text
===========================================================================

     _______  _______  _______  _______  __   __  _______  __    _
    |       ||   _   ||       ||       ||  |_|  ||   _   ||  |  | |
    |    _  ||  |_|  ||  _____||  _____||       ||  |_|  ||   |_| |
    |   |_| ||       || |_____ | |_____ |       ||       ||       |
    |    ___||       ||_____  ||_____  ||       ||       ||  _    |
    |   |    |   _   | _____| | _____| || ||_|| ||   _   || | |   |
    |___|    |__| |__||_______||_______||_|   |_||__| |__||_|  |__|
        
===========================================================================
1. PASSWORD BREACH CHECKER
2. PASSWORD GENERATOR
3. PASSWORD STRENGTH TESTER
4. EXIT
===========================================================================
```

### 1. Password Breach Checker
Checks any entered password against the local `Common passwords.txt` list.
* Outputs **`PASSWORD IS COMPROMISED`** if found in the leak database.
* Outputs **`PASSWORD IS SAFE`** if absent from the database.

### 2. Password Generator
Prompts for desired password specifications:
* Password length
* Include Uppercase letters (`Y/N`)
* Include Lowercase letters (`Y/N`)
* Include Numbers (`Y/N`)
* Include Special Characters (`Y/N`)

*Ensures at least one character from each selected set is included, shuffles the result, verifies it against the breach list, and displays the entropy calculation and strength rating.*

### 3. Password Strength Tester
Evaluates any user-provided string and outputs:
* Calculated entropy in bits.
* Color-coded strength classification.

---

## 📁 Project File Structure

```text
PASSMAN-PASSWORD-MANAGER/
├── passman.py            # Main interactive CLI application & core logic
├── Common passwords.txt  # Local database of common leaked/compromised passwords
└── README.md             # Project documentation
```

---

## 🔐 Security & Privacy

* **Zero Data Transmission**: PASSMAN runs 100% locally. Passwords evaluated or generated are stored solely in transient memory during runtime.
* **No External Dependencies**: Built strictly using standard Python libraries to mitigate supply chain risks.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
