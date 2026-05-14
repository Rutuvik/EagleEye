import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { type ListingData, type OptimizedListing, type CompetitorResearch, type VisualAudit } from "./aiService";

export interface AnalysisRecord {
  id: string;
  userId: string;
  toolType: string;
  inputData: {
    myListing: ListingData;
    competitors: ListingData[];
    currentKeywords?: string;
    additionalGoals?: string;
    uploadedKeywords?: string;
  };
  resultMarkdown: string;
  optimizedListing?: OptimizedListing;
  competitorResearch?: CompetitorResearch;
  visualAudit?: VisualAudit;
  chatHistory: { role: "user" | "model"; text: string }[];
  createdAt: any;
  updatedAt: any;
}

const ANALYSES_COLLECTION = "analyses";

export async function saveAnalysis(data: Omit<AnalysisRecord, "id" | "userId" | "createdAt" | "updatedAt">): Promise<string> {
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  const id = doc(collection(db, ANALYSES_COLLECTION)).id;
  const path = `${ANALYSES_COLLECTION}/${id}`;
  
  try {
    const record = {
      ...data,
      id,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, ANALYSES_COLLECTION, id), record);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return "";
  }
}

export async function updateAnalysis(id: string, updates: Partial<AnalysisRecord>): Promise<void> {
  const path = `${ANALYSES_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, ANALYSES_COLLECTION, id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getAnalyses(): Promise<AnalysisRecord[]> {
  if (!auth.currentUser) return [];
  const path = ANALYSES_COLLECTION;
  try {
    const q = query(
      collection(db, ANALYSES_COLLECTION),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getAnalysis(id: string): Promise<AnalysisRecord | null> {
  const path = `${ANALYSES_COLLECTION}/${id}`;
  try {
    const docSnap = await getDoc(doc(db, ANALYSES_COLLECTION, id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AnalysisRecord;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function deleteAnalysis(id: string): Promise<void> {
  const path = `${ANALYSES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, ANALYSES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
