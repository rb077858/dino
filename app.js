// 1. פרטי תצורת Firebase
// חשוב: החלף את הערכים בפרטים שאספת משלב 1 ב-Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAdTXiYOPgacKYcCLoifvPj1Qk9PhNFB9U",
  authDomain: "dinochrome-ebc8e.firebaseapp.com",
  projectId: "dinochrome-ebc8e",
  storageBucket: "dinochrome-ebc8e.firebasestorage.app",
  messagingSenderId: "722136091216",
  appId: "1:722136091216:web:618651df477ea963535f55"
};

// אתחול Firebase
firebase.initializeApp(firebaseConfig);

// הפניות למודולים של Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// הפניות לאלמנטים מה-HTML של המשחק
const dino = document.getElementById('dino');
const cactus = document.getElementById('cactus');
const gameOverScreen = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');
const currentScoreEl = document.getElementById('current-score');
const finalScoreDisplay = document.getElementById('final-score-display');
const highScoreOnGameOver = document.getElementById('high-score-on-gameover');

// הפניות לאלמנטים מה-HTML של Firebase Auth/Scores
const userDisplay = document.getElementById('user-display');
const authButtonsDiv = document.getElementById('auth-buttons'); // div המכיל את כפתורי גוגל/מייל
// const googleSignInBtn = document.getElementById('google-signin-btn'); // הוסר, אין צורך בקישור לכפתור שלא קיים
const showEmailSigninBtn = document.getElementById('show-email-signin-btn'); // כפתור להצגת טופס המייל/סיסמה
const signOutBtn = document.getElementById('signout-btn');
const highScoreDisplay = document.getElementById('high-score-display'); // תצוגת ציון גבוה כללי

// אלמנטים חדשים לטופס מייל/סיסמה
const emailAuthSection = document.getElementById('email-auth-section');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const emailSignInBtn = document.getElementById('email-signin-btn');
const emailSignUpBtn = document.getElementById('email-signup-btn');
const toggleAuthModeBtn = document.getElementById('toggle-auth-mode'); // כפתור לחזור לכפתורי התחברות

// משתנים גלובליים למשחק
let isJumping = false;
let jumpHeight = 0;
let cactusSpeed = 8;
let cactusLeft = 600;
let score = 0;
let gameInterval;
let jumpInterval;
let personalHighScore = 0; // ציון גבוה אישי של המשתמש

// 2. פונקציית קפיצה (ללא שינוי מהותי)
function jump() {
  if (isJumping) return;
  isJumping = true;
  let upInterval = setInterval(() => {
    if (jumpHeight >= 100) {
      clearInterval(upInterval);
      let downInterval = setInterval(() => {
        if (jumpHeight <= 0) {
          clearInterval(downInterval);
          isJumping = false;
        } else {
          jumpHeight -= 10;
          dino.style.bottom = jumpHeight + 'px';
        }
      }, 20);
    } else {
      jumpHeight += 10;
      dino.style.bottom = jumpHeight + 'px';
    }
  }, 20);
}

// 3. פונקציית התחלת המשחק (עם שינויים קלים לשילוב Firebase)
function startGame() {
  cactusLeft = 600;
  cactus.style.left = cactusLeft + 'px';
  score = 0;
  currentScoreEl.textContent = 'ציון נוכחי: ' + score;
  gameOverScreen.style.display = 'none';

  isJumping = false;
  jumpHeight = 0;
  dino.style.bottom = '0px';

  clearInterval(gameInterval);

  gameInterval = setInterval(() => {
    cactusLeft -= cactusSpeed;
    cactus.style.left = cactusLeft + 'px';

    const dinoRect = dino.getBoundingClientRect();
    const cactusRect = cactus.getBoundingClientRect();

    if (
      cactusRect.left < dinoRect.right &&
      cactusRect.right > dinoRect.left &&
      cactusRect.top < dinoRect.bottom &&
      cactusRect.bottom > dinoRect.top &&
      jumpHeight < 40
    ) {
      clearInterval(gameInterval);
      gameOverScreen.style.display = 'flex';
      finalScoreDisplay.textContent = 'הציון שלך: ' + score;
      
      saveHighScore(score); 
      highScoreOnGameOver.textContent = 'הציון הגבוה שלך: ' + personalHighScore;
    }

    if (cactusLeft < -20) {
      cactusLeft = 600;
      score++;
      currentScoreEl.textContent = 'ציון נוכחי: ' + score;

      if (score % 5 === 0) {
        cactusSpeed += 0.5;
      }
    }
  }, 20);
}

// 4. פונקציית כניסה עם גוגל - **הוסרה**
// async function signInWithGoogle() {
//     const provider = new firebase.auth.GoogleAuthProvider();
//     try {
//         await auth.signInWithPopup(provider);
//         console.log("התחברת בהצלחה עם גוגל!");
//     } catch (error) {
//         console.error("שגיאה בהתחברות עם גוגל:", error.message);
//         alert("שגיאה בהתחברות: " + error.message);
//     }
// }

// 5. פונקציית התנתקות (ללא שינוי)
async function signOutUser() {
    try {
        await auth.signOut();
        console.log("התנתקת בהצלחה!");
    } catch (error) {
        console.error("שגיאה בהתנתקות:", error.message);
        alert("שגיאה בהתנתקות: " + error.message);
    }
}

// 6. פונקציה לשמירה או עדכון של ציון גבוה (ללא שינוי)
async function saveHighScore(currentScore) {
    const user = auth.currentUser;
    if (user) {
        const userRef = db.collection('highScores').doc(user.uid);
        try {
            const doc = await userRef.get();
            let existingHighScore = 0;
            if (doc.exists) {
                existingHighScore = doc.data().score || 0;
            }

            if (currentScore > existingHighScore) {
                await userRef.set({
                    userId: user.uid,
                    displayName: user.displayName || user.email || 'משתמש אנונימי',
                    score: currentScore,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                personalHighScore = currentScore;
                highScoreDisplay.textContent = 'ציון גבוה אישי: ' + personalHighScore;
                console.log(`ציון גבוה חדש של ${currentScore} נשמר בהצלחה למשתמש ${user.displayName || user.email}.`);
            } else {
                console.log(`הציון הנוכחי (${currentScore}) אינו גבוה יותר מהציון הקיים (${existingHighScore}).`);
            }
        } catch (error) {
            console.error("שגיאה בשמירת הציון הגבוה:", error.message);
            alert("שגיאה בשמירת הציון הגבוה: " + error.message);
        }
    } else {
        console.log("לא מחובר. הציון הגבוה לא נשמר.");
    }
}

// 7. פונקציה לקריאת והצגת הציון הגבוה של המשתמש (ללא שינוי)
async function fetchAndDisplayHighScore() {
    const user = auth.currentUser;
    if (user) {
        const userRef = db.collection('highScores').doc(user.uid);
        try {
            const doc = await userRef.get();
            if (doc.exists) {
                personalHighScore = doc.data().score || 0;
                highScoreDisplay.textContent = 'ציון גבוה אישי: ' + personalHighScore;
            } else {
                personalHighScore = 0;
                highScoreDisplay.textContent = 'ציון גבוה אישי: 0';
            }
        } catch (error) {
            console.error("שגיאה בקריאת הציון הגבוה:", error.message);
            highScoreDisplay.textContent = 'ציון גבוה אישי: --';
        }
    } else {
        personalHighScore = 0;
        highScoreDisplay.textContent = 'ציון גבוה אישי: --';
    }
}

// 8. פונקציית רישום משתמש חדש עם מייל וסיסמה (ללא שינוי)
async function signUpWithEmailPassword() {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        alert("אנא הזן מייל וסיסמה.");
        return;
    }

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        alert("ההרשמה בוצעה בהצלחה! התחברת כעת.");
    } catch (error) {
        console.error("שגיאה בהרשמה:", error.code, error.message);
        let errorMessage = "שגיאה בהרשמה.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "המייל כבר בשימוש. נסה להתחבר.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "כתובת מייל לא חוקית.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "הסיסמה חלשה מדי (לפחות 6 תווים).";
        }
        alert(errorMessage + " (" + error.message + ")");
    }
}

// 9. פונקציית כניסה עם מייל וסיסמה (ללא שינוי)
async function signInWithEmailPassword() {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        alert("אנא הזן מייל וסיסמה.");
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert("התחברת בהצלחה!");
    } catch (error) {
        console.error("שגיאה בהתחברות:", error.code, error.message);
        let errorMessage = "שגיאה בהתחברות.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = "מייל או סיסמה שגויים.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "כתובת מייל לא חוקית.";
        }
        alert(errorMessage + " (" + error.message + ")");
    }
}

// 10. פונקציה לניהול תצוגת טפסי האימות (ללא שינוי)
function toggleAuthForms(showEmailForm) {
    if (showEmailForm) {
        authButtonsDiv.style.display = 'none';
        emailAuthSection.style.display = 'block';
    } else {
        authButtonsDiv.style.display = 'block';
        emailAuthSection.style.display = 'none';
    }
}

// 11. האזנה לשינויים במצב ההתחברות (auth.onAuthStateChanged) (ללא שינוי מהותי)
auth.onAuthStateChanged(user => {
    if (user) {
        userDisplay.textContent = `מחובר כ: ${user.displayName || user.email}`;
        authButtonsDiv.style.display = 'none';
        emailAuthSection.style.display = 'none';
        signOutBtn.style.display = 'inline-block';
        fetchAndDisplayHighScore();
    } else {
        userDisplay.textContent = "לא מחובר";
        signOutBtn.style.display = 'none';
        toggleAuthForms(false); 
        highScoreDisplay.textContent = 'ציון גבוה אישי: --';
        personalHighScore = 0;
    }
});

// 12. הגדרת מאזיני אירועים לכפתורים ולמקשים
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    if (gameOverScreen.style.display === 'none') {
      jump();
    }
  }
});

restartBtn.addEventListener('click', () => {
  startGame();
});

// googleSignInBtn.addEventListener('click', signInWithGoogle); // הוסר, אין צורך במאזין לכפתור שלא קיים
signOutBtn.addEventListener('click', signOutUser);

// מאזינים חדשים לכפתורי המייל/סיסמה (ללא שינוי)
showEmailSigninBtn.addEventListener('click', () => toggleAuthForms(true));
emailSignInBtn.addEventListener('click', signInWithEmailPassword);
emailSignUpBtn.addEventListener('click', signUpWithEmailPassword);
toggleAuthModeBtn.addEventListener('click', () => toggleAuthForms(false));

startGame();
