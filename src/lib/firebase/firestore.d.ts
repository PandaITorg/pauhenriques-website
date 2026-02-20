declare module "firebase/firestore" {
  import {
    Timestamp,
    GeoPoint,
    DocumentReference,
    CollectionReference,
    Query,
    DocumentData,
  } from "@firebase/firestore-types";

  export {
    getFirestore,
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    Timestamp,
    GeoPoint,
    DocumentReference,
    CollectionReference,
    Query,
    DocumentData,
  } from "@firebase/firestore";
}
