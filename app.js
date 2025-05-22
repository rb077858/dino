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
const currentScoreEl = document.getElementById('current-score'); // שינוי שם
const finalScoreDisplay = document.getElementById('final-score-display');
const highScoreOnGameOver = document.getElementById('high-score-on-gameover');


// הפניות לאלמנטים מה-HTML של Firebase Auth/Scores
const userDisplay = document.getElementById('user-display');
const googleSignInBtn = document.getElementById('google-signin-btn');
const signOutBtn = document.getElementById('signout-btn');
const highScoreDisplay = document.getElementById('high-score-display'); // תצוגת ציון גבוה כללי

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
  currentScoreEl.textContent = 'ציון נוכחי: ' + score; // עדכן את התצוגה
  gameOverScreen.style.display = 'none';

  // ודא שהדינו במצב התחלתי
  isJumping = false;
  jumpHeight = 0;
  dino.style.bottom = '0px';

  // עצור כל אינטרוול קודם למניעת באגים
  clearInterval(gameInterval);

  gameInterval = setInterval(() => {
    cactusLeft -= cactusSpeed;
    cactus.style.left = cactusLeft + 'px';

    // בדיקת התנגשות (Collision detection)
    const dinoRect = dino.getBoundingClientRect();
    const cactusRect = cactus.getBoundingClientRect();

    if (
      cactusRect.left < dinoRect.right &&
      cactusRect.right > dinoRect.left &&
      cactusRect.top < dinoRect.bottom &&
      cactusRect.bottom > dinoRect.top &&
      jumpHeight < 40 // הדינו לא מספיק גבוה כדי לדלג
    ) {
      // Game over
      clearInterval(gameInterval);
      gameOverScreen.style.display = 'flex';
      finalScoreDisplay.textContent = 'הציון שלך: ' + score;
      
      // שמור ציון גבוה לאחר שהמשחק נגמר
      saveHighScore(score); 
      // הצג את הציון הגבוה האישי במסך ה-Game Over
      highScoreOnGameOver.textContent = 'הציון הגבוה שלך: ' + personalHighScore;
    }

    if (cactusLeft < -20) {
      cactusLeft = 600; // אפס מיקום קקטוס
      score++;
      currentScoreEl.textContent = 'ציון נוכחי: ' + score;

      // הגבר מהירות כל 5 נקודות
      if (score % 5 === 0) {
        cactusSpeed += 0.5; // הגבר קצת פחות אגרסיבי
      }
    }
  }, 20);
}

// 4. פונקציית כניסה עם גוגל
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        console.log("התחברת בהצלחה עם גוגל!");
        // onAuthStateChanged יטפל בעדכון ה-UI
    } catch (error) {
        console.error("שגיאה בהתחברות עם גוגל:", error.message);
        alert("שגיאה בהתחברות: " + error.message);
    }
}

// 5. פונקציית התנתקות
async function signOutUser() {
    try {
        await auth.signOut();
        console.log("התנתקת בהצלחה!");
        // onAuthStateChanged יטפל בעדכון ה-UI
    } catch (error) {
        console.error("שגיאה בהתנתקות:", error.message);
        alert("שגיאה בהתנתקות: " + error.message);
    }
}

// 6. פונקציה לשמירה או עדכון של ציון גבוה
async function saveHighScore(currentScore) {
    const user = auth.currentUser;
    if (user) {
        const userRef = db.collection('highScores').doc(user.uid); // UID של המשתמש הוא ה-ID של המסמך
        try {
            // קריאת הציון הנוכחי של המשתמש (אם קיים)
            const doc = await userRef.get();
            let existingHighScore = 0;
            if (doc.exists) {
                existingHighScore = doc.data().score || 0;
            }

            // עדכון רק אם הציון החדש גבוה יותר
            if (currentScore > existingHighScore) {
                await userRef.set({
                    userId: user.uid,
                    displayName: user.displayName,
                    score: currentScore,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp() // חותמת זמן של העדכון
                });
                personalHighScore = currentScore; // עדכן את המשתנה הגלובלי
                highScoreDisplay.textContent = 'ציון גבוה אישי: ' + personalHighScore; // עדכן את התצוגה הכללית
                console.log(`ציון גבוה חדש של ${currentScore} נשמר בהצלחה למשתמש ${user.displayName}.`);
            } else {
                console.log(`הציון הנוכחי (${currentScore}) אינו גבוה יותר מהציון הקיים (${existingHighScore}).`);
            }
        } catch (error) {
            console.error("שגיאה בשמירת הציון הגבוה:", error.message);
            alert("שגיאה בשמירת הציון הגבוה: " + error.message);
        }
    } else {
        console.log("לא מחובר. הציון הגבוה לא נשמר.");
        // ניתן להוסיף הודעה למשתמש אם תרצה
    }
}

// 7. פונקציה לקריאת והצגת הציון הגבוה של המשתמש
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
                personalHighScore = 0; // אם אין ציון, אפס
                highScoreDisplay.textContent = 'ציון גבוה אישי: 0';
            }
        } catch (error) {
            console.error("שגיאה בקריאת הציון הגבוה:", error.message);
            highScoreDisplay.textContent = 'ציון גבוה אישי: --'; // הצג שגיאה
        }
    } else {
        personalHighScore = 0; // אם לא מחובר, אין ציון אישי
        highScoreDisplay.textContent = 'ציון גבוה אישי: --'; // אם לא מחובר, אין ציון להציג
    }
}

// 8. האזנה לשינויים במצב ההתחברות (לדוגמה: כשהמשתמש מתחבר או מתנתק)
auth.onAuthStateChanged(user => {
    if (user) {
        // המשתמש מחובר
        userDisplay.textContent = `מחובר כ: ${user.displayName}`;
        googleSignInBtn.style.display = 'none'; // הסתר כפתור כניסה
        signOutBtn.style.display = 'inline-block'; // הצג כפתור התנתקות
        fetchAndDisplayHighScore(); // טען והצג את הציון הגבוה שלו
    } else {
        // המשתמש לא מחובר
        userDisplay.textContent = "לא מחובר";
        googleSignInBtn.style.display = 'inline-block'; // הצג כפתור כניסה
        signOutBtn.style.display = 'none'; // הסתר כפתור התנתקות
        highScoreDisplay.textContent = 'ציון גבוה אישי: --'; // נקה את תצוגת הציון
        personalHighScore = 0; // אפס את הציון הגבוה האישי
    }
});

// 9. הגדרת מאזיני אירועים לכפתורים ולמקשים
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    if (gameOverScreen.style.display === 'none') { // אפשר לקפוץ רק אם המשחק פועל
      jump();
    }
  }
});

restartBtn.addEventListener('click', () => {
  startGame();
});

googleSignInBtn.addEventListener('click', signInWithGoogle);
signOutBtn.addEventListener('click', signOutUser);

// התחל את המשחק באופן אוטומטי בטעינת הדף (רק אם הוא לא במצב Game Over)
startGame();
