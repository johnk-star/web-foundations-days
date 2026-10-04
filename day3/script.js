let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes(word)
function searchNotes(word) {
  const searchTerm = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(searchTerm));
}

// 2. longestNote()
function longestNote() {
  if (notes.length === 0) return null;
  
  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

// 3. countByCategory()
function countByCategory() {
  const counts = {};
  for (let i = 0; i < notes.length; i++) {
    const category = notes[i].category;
    if (counts[category]) {
      counts[category]++;
    } else {
      counts[category] = 1;
    }
  }
  return counts;
}

// 4. getSummary()
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const noun = total === 1 ? "note" : "notes";
  
  const personalCount = counts.personal || 0;
  const workCount = counts.work || 0;
  const studyCount = counts.study || 0;

  return `${total} ${noun}: ${personalCount} personal, ${workCount} work, ${studyCount} study.`;
}

// 5. isDuplicate(text)
function isDuplicate(text) {
  const cleanText = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === cleanText);
}

// 6. addNote(text, category)
function addNote(text, category) {
  const cleanText = text.trim();
  
  // Check length
  if (cleanText.length < 1 || cleanText.length > 200) {
    console.log("Failed to add: Text must be between 1 and 200 characters.");
    return false;
  }
  
  // Check category
  if (category !== "personal" && category !== "work" && category !== "study") {
    console.log("Failed to add: Invalid category.");
    return false;
  }

  // Check duplicate
  if (isDuplicate(cleanText)) {
    console.log("Failed to add: This note is a duplicate.");
    return false;
  }

  // Create new ID and add note
  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: newId, text: cleanText, category: category });
  console.log("Success: Note added.");
  return true;
}


// --- TESTS ---

console.log("--- Testing searchNotes ---");
// Normal case
console.log(searchNotes("assignment")); 
// Expected: Array with 1 object {id: 2, text: "Finish the Day 3 assignment", category: "study"}
// Edge case: Word that doesn't exist
console.log(searchNotes("pizza")); 
// Expected: []

console.log("\n--- Testing longestNote ---");
// Normal case
console.log(longestNote()); 
// Expected: {id: 3, text: "Email the project report to Grace", category: "work"}
// Edge case: Empty array
let tempNotes1 = [...notes]; // Save current notes
notes = []; // Empty the array temporarily
console.log(longestNote()); 
// Expected: null
notes = [...tempNotes1]; // Restore notes

console.log("\n--- Testing countByCategory ---");
// Normal case
console.log(countByCategory()); 
// Expected: { personal: 2, study: 2, work: 1 }
// Edge case: All same category
let tempNotes2 = [...notes];
notes = [{id: 1, text: "A", category: "study"}, {id: 2, text: "B", category: "study"}];
console.log(countByCategory()); 
// Expected: { study: 2 }
notes = [...tempNotes2];

console.log("\n--- Testing getSummary ---");
// Normal case (Multiple notes)
console.log(getSummary()); 
// Expected: "5 notes: 2 personal, 1 work, 2 study."
// Edge case (Exactly 1 note to test singular "note")
let tempNotes3 = [...notes];
notes = [{id: 1, text: "Single note", category: "work"}];
console.log(getSummary()); 
// Expected: "1 note: 0 personal, 1 work, 0 study."
notes = [...tempNotes3];

console.log("\n--- Testing isDuplicate ---");
// Normal case (Duplicate exists, ignoring extra spaces and case)
console.log(isDuplicate("   CALL MUM   ")); 
// Expected: true
// Edge case (Does not exist)
console.log(isDuplicate("Walk the dog")); 
// Expected: false

console.log("\n--- Testing addNote ---");
// Normal case (Valid note)
console.log(addNote("Go to the gym", "personal")); 
// Expected: true (and logs "Success: Note added.")
// Edge case 1: Duplicate text
console.log(addNote("Call mum", "personal")); 
// Expected: false (and logs "Failed to add: This note is a duplicate.")
// Edge case 2: Empty text
console.log(addNote("   ", "work")); 
// Expected: false (and logs "Failed to add: Text must be between 1 and 200 characters.")