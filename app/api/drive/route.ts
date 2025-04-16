import { NextResponse } from 'next/server';
import { google, drive_v3 } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';

// Initialize Google Drive client
async function getDriveClient(): Promise<drive_v3.Drive> {
  const credentials = process.env.GOOGLE_CREDENTIALS;
  if (!credentials) {
    throw new Error('GOOGLE_CREDENTIALS environment variable is not set');
  }

  const auth = new GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  
  const authClient = (await auth.getClient()) as OAuth2Client;
  return google.drive({ version: 'v3', auth: authClient });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const fileId = searchParams.get('fileId');
    const parentFolderId = searchParams.get('parentFolderId');

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    const drive = await getDriveClient();

    switch (action) {
      case 'listFiles': {
        if (!parentFolderId) {
          return NextResponse.json(
            { error: 'parentFolderId is required for listFiles action' },
            { status: 400 }
          );
        }

        // Find the Tickets folder
        const folderSearchRes = await drive.files.list({
          q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name contains 'Tickets' and trashed = false`,
          fields: 'files(id, name, mimeType)',
          spaces: 'drive',
        });

        const folderFiles = folderSearchRes.data.files || [];
        if (folderFiles.length === 0) {
          return NextResponse.json(
            { error: 'No Tickets folder found' },
            { status: 404 }
          );
        }

        const ticketsFolderId = folderFiles[0].id;

        // Look for files in the Tickets folder
        const filesListRes = await drive.files.list({
          q: `'${ticketsFolderId}' in parents and (mimeType contains 'image/' or mimeType='application/pdf') and trashed=false`,
          fields: 'files(id, name, mimeType)',
          orderBy: 'createdTime desc',
          spaces: 'drive',
        });

        return NextResponse.json(filesListRes.data);
      }

      case 'getFile': {
        if (!fileId) {
          return NextResponse.json(
            { error: 'fileId is required for getFile action' },
            { status: 400 }
          );
        }

        const fileRes = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );

        const buffer = Buffer.from(fileRes.data as ArrayBuffer);
        const base64Data = buffer.toString('base64');

        return NextResponse.json({ data: base64Data });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in drive API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 