const fs = require('fs');
const path = require('path');

try {
  // Define the path to the passwords file using path.join to handle the parentheses correctly
  const passwordsFilePath = path.join(__dirname, 'app', '(tabs)', 'passwords.tsx');
  
  // Check if the file exists before attempting to delete
  if (fs.existsSync(passwordsFilePath)) {
    console.log('Deleting passwords.tsx file...');
    fs.unlinkSync(passwordsFilePath);
    console.log('Successfully deleted passwords.tsx file');
  } else {
    console.log('passwords.tsx file not found, may have already been deleted');
  }
} catch (error) {
  console.error('Error deleting file:', error);
}
