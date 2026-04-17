const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/java/com/gluniversity/textbookrecyclesys/controller/AdminController.java';
let c = fs.readFileSync(path, 'utf8');

// Find the start of the updateBookStatus method I added (at ~6618)
// It starts with @PutMapping and ends just before the @PutMapping for /books/{id}
const marker = `    @PutMapping(\"/books/{id}/status\")
    public ResponseEntity<ApiResponse<String>> updateBookStatus`;

const dupMarker = `    @PutMapping(\"/books/{id}\")
    public ResponseEntity<ApiResponse<Book>> updateBook`;

// Check if the duplicate marker exists (it should - it's the existing method)
if (c.includes(dupMarker)) {
    // Find the position of the method I added
    const myMethodStart = c.indexOf(marker);
    const existingMethodStart = c.indexOf(dupMarker);

    if (myMethodStart !== -1 && myMethodStart < existingMethodStart) {
        // Remove my method
        const toRemove = c.slice(myMethodStart, existingMethodStart);
        c = c.replace(toRemove, '');
        fs.writeFileSync(path, c, 'utf8');
        console.log('Removed duplicate updateBookStatus method');
    } else {
        console.log('Positions unexpected:', myMethodStart, existingMethodStart);
    }
} else {
    console.log('Existing method marker not found');
}
