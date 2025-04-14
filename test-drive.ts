import { config } from 'dotenv';
import { testDriveFolder } from './lib/guest-parser';

// Load environment variables from .env.test
config({ path: '.env.test' });

const folderUrl = 'https://drive.google.com/drive/folders/1RQXjI9EKTxdr-SeNU-zekYAQjkd01H7_';

console.log('Starting Drive folder test...');
console.log('Using Google Drive API Key:', process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY);

testDriveFolder(folderUrl)
  .then(() => {
    console.log('Test complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  }); 