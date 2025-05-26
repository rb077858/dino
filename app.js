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
const authButtonsDiv = document.getElementById('auth-buttons');
const showEmailSigninBtn = document.getElementById('show-email-signin-btn');
const signOutBtn = document.getElementById('signout-btn');
const highScoreDisplay = document.getElementById('high-score-display');

// אלמנטים חדשים לטופס מייל/סיסמה
const emailAuthSection = document.getElementById('email-auth-section');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const emailSignInBtn = document.getElementById('email-signin-btn');
const emailSignUpBtn = document.getElementById('email-signup-btn');
const toggleAuthModeBtn = document.getElementById('toggle-auth-mode');

// משתנים גלובליים למשחק
let isJumping = false;
let jumpHeight = 0;
let cactusSpeed = 8;
let cactusLeft = 600;
let score = 0;
let gameInterval;
let jumpInterval;
let personalHighScore = 0;

// 2. פונקציית קפיצה
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

// 3. פונקציית התחלת המשחק
function startGame() {
  // לוודא שהאלמנטים הגרפיים של המשחק קיימים לפני שמתחילים להפעיל עליהם פעולות
  if (!dino || !cactus || !currentScoreEl || !gameOverScreen) {
    console.error("שגיאה: אחד מאלמנטי המשחק הראשיים (dino, cactus, game, gameOver) חסר ב-HTML או שה-ID שלו שגוי. ודא ששמות ה-ID תואמים לקוד ה-HTML.");
    // ייתכן שנרצה להציג הודעה למשתמש או לעצור את המשחק בצורה אלגנטית
    return;
  }

  cactusLeft = 600;
  cactus.style.left = cactusLeft + 'px';
  score = 0;
  currentScoreEl.textContent = 'ציון נוכחי: ' + score;
  gameOverScreen.style.display = 'none'; // ודא שמסך הסיום מוסתר בתחילת משחק

  isJumping = false;
  jumpHeight = 0;
  dino.style.bottom = '0px';

  clearInterval(gameInterval); // נקה כל אינטרוול משחק קודם אם קיים

  gameInterval = setInterval(() => {
    cactusLeft -= cactusSpeed;
    cactus.style.left = cactusLeft + 'px';

    const dinoRect = dino.getBoundingClientRect();
    const cactusRect = cactus.getBoundingClientRect();

    // בדיקת התנגשות
    if (
      cactusRect.left < dinoRect.right &&
      cactusRect.right > dinoRect.left &&
      cactusRect.top < dinoRect.bottom &&
      cactusRect.bottom > dinoRect.top &&
      jumpHeight < 40 // הדינו "על הקרקע" (או קרוב אליה)
    ) {
      clearInterval(gameInterval); // עצור את המשחק
      gameOverScreen.style.display = 'flex'; // הצג מסך סיום
      finalScoreDisplay.textContent = 'הציון שלך: ' + score;
      
      saveHighScore(score); // נסה לשמור את הציון הגבוה
      // עדכן את הציון הגבוה במסך הסיום (personalHighScore יתעדכן ב-saveHighScore)
      highScoreOnGameOver.textContent = 'הציון הגבוה שלך: ' + personalHighScore; 
    }

    // איפוס קקטוס והעלאת ציון
    if (cactusLeft < -20) {
      cactusLeft = 600; // החזר את הקקטוס לצד ימין
      score++;
      currentScoreEl.textContent = 'ציון נוכחי: ' + score;

      if (score % 5 === 0) { // הגבר מהירות כל 5 נקודות
        cactusSpeed += 0.5;
      }
    }
  }, 20); // 20 מילישניות = 50 פריימים לשנייה
}

// 4. פונקציית התנתקות
async function signOutUser() {
    try {
        await auth.signOut();
        console.log("התנתקת בהצלחה!");
    } catch (error) {
        console.error("שגיאה בהתנתקות:", error.message);
        alert("שגיאה בהתנתקות: " + error.message);
    }
}

// 5. פונקציה לשמירה או עדכון של ציון גבוה
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
                if (highScoreDisplay) highScoreDisplay.textContent = 'ציון גבוה אישי: ' + personalHighScore;
                console.log(`ציון גבוה חדש של ${currentScore} נשמר בהצלחה למשתמש ${user.displayName || user.email}.`);
            } else {
                console.log(`הציון הנוכחי (${currentScore}) אינו גבוה יותר מהציון הקיים (${existingHighScore}).`);
            }
        } catch (error) {
            console.error("שגיאה בשמירת הציון הגבוה:", error.message);
            // מומלץ לא להציג אלרט למשתמש על שגיאות כאלה אלא אם הן קריטיות, רק ב-console
        }
    } else {
        console.log("לא מחובר. הציון הגבוה לא נשמר.");
    }
}

// 6. פונקציה לקריאת והצגת הציון הגבוה של המשתמש
async function fetchAndDisplayHighScore() {
    const user = auth.currentUser;
    if (user) {
        const userRef = db.collection('highScores').doc(user.uid);
        try {
            const doc = await userRef.get();
            if (doc.exists) {
                personalHighScore = doc.data().score || 0;
                if (highScoreDisplay) highScoreDisplay.textContent = 'ציון גבוה אישי: ' + personalHighScore;
            } else {
                personalHighScore = 0;
                if (highScoreDisplay) highScoreDisplay.textContent = 'ציון גבוה אישי: 0';
            }
        } catch (error) {
            console.error("שגיאה בקריאת הציון הגבוה:", error.message);
            if (highScoreDisplay) highScoreDisplay.textContent = 'ציון גבוה אישי: --';
        }
    } else {
        personalHighScore = 0;
        if (highScoreDisplay) highScoreDisplay.textContent = 'ציון גבוה אישי: --';
    }
}

// 7. פונקציית רישום משתמש חדש עם מייל וסיסמה
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
        // onAuthStateChanged יטפל בעדכון ה-UI לאחר ההרשמה והכניסה
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

// 8. פונקציית כניסה עם מייל וסיסמה
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
        // onAuthStateChanged יטפל בעדכון ה-UI לאחר הכניסה
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

// 9. פונקציה לניהול תצוגת טפסי האימות
function toggleAuthForms(showEmailForm) {
    if (authButtonsDiv) { // ודא שהאלמנט קיים
        authButtonsDiv.style.display = showEmailForm ? 'none' : 'block';
    }
    if (emailAuthSection) { // ודא שהאלמנט קיים
        emailAuthSection.style.display = showEmailForm ? 'block' : 'none';
    }
}

// 10. האזנה לשינויים במצב ההתחברות (auth.onAuthStateChanged)
auth.onAuthStateChanged(user => {
    if (user) {
        // המשתמש מחובר
        userDisplay.textContent = `מחובר כ: ${user.displayName || user.email}`;
        if (authButtonsDiv) authButtonsDiv.style.display = 'none';
        if (emailAuthSection) emailAuthSection.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'inline-block';
        fetchAndDisplayHighScore(); // טען והצג את הציון הגבוה שלו
    } else {
        // המשתמש לא מחובר
        userDisplay.textContent = "לא מחובר";
        if (signOutBtn) signOutBtn.style.display = 'none';
        
        // הצג את כפתורי הכניסה הכלליים כברירת מחדל
        toggleAuthForms(false); 
        
        if (highScoreDisplay) highScoreDisplay.textContent = 'ציון גבוה אישי: --';
        personalHighScore = 0; // אפס ציון אישי כשלא מחובר
    }
});

// 11. הגדרת מאזיני אירועים לכפתורים ולמקשים
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    // ודא שמסך הסיום מוסתר לפני הקפיצה
    if (gameOverScreen && gameOverScreen.style.display === 'none') {
      jump();
    }
  }
});

if (restartBtn) { // ודא שהאלמנט קיים לפני הוספת מאזין
    restartBtn.addEventListener('click', () => {
      startGame();
    });
}

if (signOutBtn) { // ודא שהאלמנט קיים לפני הוספת מאזין
    signOutBtn.addEventListener('click', signOutUser);
}

if (showEmailSigninBtn) {
    showEmailSigninBtn.addEventListener('click', () => toggleAuthForms(true));
}
if (emailSignInBtn) {
    emailSignInBtn.addEventListener('click', signInWithEmailPassword);
}
if (emailSignUpBtn) {
    emailSignUpBtn.addEventListener('click', signUpWithEmailPassword);
}
if (toggleAuthModeBtn) {
    toggleAuthModeBtn.addEventListener('click', () => toggleAuthForms(false));
}


// התחל את המשחק באופן אוטומטי בטעינת הדף
startGame();
