const {
  getDatabase,
  ref,
  child,
  get,
  orderByChild,
  equalTo,
} = require("firebase/database");
const { firebaseConfig } = require("./src/config");
const { initializeApp } = require("firebase/app");

initializeApp(firebaseConfig);
const db = getDatabase();
const dbRef = ref(db);
const nomeTabela = "vinculacoes_solicitacoes";
const tabela = child(dbRef, nomeTabela, orderByChild("respondida"));

get(tabela, orderByChild("respondida"), equalTo(false)).then((retorno) => {
  console.log(retorno.val());
});
