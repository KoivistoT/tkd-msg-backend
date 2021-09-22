const schedule = require("node-schedule");
const firebase = require("firebase");
const fetch = require("node-fetch");

const dayjs = require("dayjs");
require("firebase/firestore");

const firebaseLogin = async () => {
  let isUser;
  try {
    await firebase
      .auth()
      //   .signInWithEmailAndPassword("testuser@riverc.com", "testUser"); //tämä testiympäristö
      .signInWithEmailAndPassword("koivisto_timo@hotmail.com", "jaaha1234");

    await firebase.auth().onAuthStateChanged((user) => {
      if (user != null) {
        // console.log("We are authenticated now!");
        isUser = true;
      } else {
        // console.log("Ei olla nyt kirjautunut");
        isUser = false;
      }
    });
  } catch (error) {
    console.log(error, "tästä");
  }
  return isUser;
};

const fetchAudioList = async (url) => {
  try {
    const data = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Token token=d1f62d870ce12a9e6bef1a81cb5b3229",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        return data;
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    return data;
  } catch (error) {
    console.log(error);
  }
};
const populateData = (result, language) => {
  const data = [];
  result.forEach((item) => {
    if (item.private === false) {
      item.type = "podcasts";
      item.language = language;
      item.publish = true;
      data.push(item);
    }
  });
  console.log(data);
  return data;
};
const saveDataToFirebase = async (data) => {
  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();

  try {
    if (isLoggedIn) {
      try {
        data.forEach(async (item) => {
          const id = item.id.toString();
          await db.collection("appContent").doc(id).set(item);
        });
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getAndSavePodcasts = function () {
  const urls = [
    {
      url: "https://www.buzzsprout.com/api/1726915/episodes.json",
      language: "EN",
    },
    {
      url: "https://www.buzzsprout.com/api/1616851/episodes.json",
      language: "FIN",
    },
  ];

  var result;
  var data;
  urls.forEach(async (item) => {
    result = await fetchAudioList(item.url);
    data = populateData(result, item.language);
    saveDataToFirebase(data);
  });

  // setData();
  // schedule.scheduleJob("10 * * * *", function () {
  //   setData();
  // });

  //   schedule.scheduleJob("0 17 ? * 0,4-6", function () {
  //     setData();
  //   });
};

module.exports.saveFetchTime = async function () {
  const dateNow = dayjs().format("DD-MM-YYYY HH:mm");
  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();

  try {
    if (isLoggedIn) {
      await db
        .collection("timestamps")
        .doc("buzzsprout")
        .set({ latestFechTime: dateNow });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getLastFetchTime = async function () {
  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();

  try {
    if (isLoggedIn) {
      const result = await db.collection("timestamps").doc("buzzsprout").get();

      const time = result.data().latestFechTime;
      return time;
    }
  } catch (error) {
    console.log(error);
    return "Error";
  }
};
