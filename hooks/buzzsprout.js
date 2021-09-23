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
      const newItem = {
        type: "podcasts",
        language: language,
        publish: true,
        id: item.id,
        artist: item.artist,
        artwork_url: item.artwork_url,
        audio_url: item.audio_url,
        description: item.description,
        duration: item.duration,
        title: item.title,
        published_at: item.published_at,
      };

      data.push(newItem);
    }
  });
  // console.log(data);
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

const getAppContent = async () => {
  await firebaseLogin();

  var db = firebase.firestore();
  try {
    var allData = [];
    db.collection("appContent")
      .where("type", "==", "podcasts")
      .get()
      .then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
          allData.push({ id: doc.id, ...doc.data() });
        });
      });
    return allData;
  } catch (error) {
    console.log(error);
  }
};

const checkNewPodcasts = (buzzsproutPodcasts, appPodcasts) => {
  const data = [];

  buzzsproutPodcasts.forEach((item) => {
    const index = appPodcasts.findIndex((x) => x.id === item.id);
    if (index === -1) {
      data.push(item);
    }
  });
  return data;
};

module.exports.getAndSavePodcasts = async function () {
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

  const appPodcasts = await getAppContent();
  // console.log(appPodcasts);
  urls.forEach(async (item) => {
    const result = await fetchAudioList(item.url);
    const buzzsproutPodcasts = await populateData(result, item.language);

    const data = await checkNewPodcasts(buzzsproutPodcasts, appPodcasts);
    if (data.length > 0) {
      saveDataToFirebase(data);
    }
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
  const dateNow = dayjs().add(3, "hour").format("DD-MM-YYYY HH:mm");
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
