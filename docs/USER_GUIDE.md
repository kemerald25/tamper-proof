# User Guide

Comprehensive user guide for the Tamper-Proof Academic Records System.

## Table of Contents

1. [Student Portal](#student-portal)
2. [Faculty Admin Panel](#faculty-admin-panel)
3. [Public Verification Portal](#public-verification-portal)

## Student Portal

### Getting Started

1. Navigate to the Student Portal
2. Click "Connect Wallet"
3. Select your wallet provider (MetaMask, Trust Wallet, etc.)
4. Approve the connection request
5. Sign the authentication message when prompted

### Viewing Your Records

1. After connecting your wallet, you'll be redirected to your dashboard
2. Your dashboard displays:
   - Student information (name, matric number, department)
   - All your academic records
   - Verification status for each record

### Viewing Detailed Results

1. Click on "Results" in the navigation menu
2. Browse through your academic records
3. Each result shows:
   - Course code and title
   - Grade and credit units
   - Semester and academic session
   - Blockchain verification status

### Downloading Transcripts

1. Navigate to the Results page
2. Find the result you want to download
3. Click "Download PDF" button
4. The transcript will be downloaded as a PDF file
5. The PDF includes:
   - Course information
   - Grade and credit units
   - IPFS hash for verification
   - Blockchain transaction hash (if verified)

### Generating QR Codes

1. Navigate to the Results page
2. Click "View QR Code" for any result
3. A QR code will be displayed
4. Share this QR code with employers or institutions for verification
5. The QR code contains all necessary verification data

### Verifying Records

1. Records are automatically verified when you view them
2. Verification status is indicated by:
   - Green "Verified" badge for confirmed records
   - Yellow "Pending" badge for unconfirmed records
3. You can manually verify a record by clicking "Verify" on the record details page

## Faculty Admin Panel

### Logging In

1. Navigate to the Admin Panel
2. Enter your username and password
3. Click "Login"
4. You'll be redirected to your dashboard

### Dashboard Overview

The admin dashboard displays:
- Total number of students
- Total number of results
- Pending verifications count
- Recent results uploaded

### Uploading Results

#### Single Result Upload

1. Navigate to "Upload Results"
2. Fill in the form:
   - Student ID
   - Course Code
   - Course Title
   - Grade
   - Credit Units
   - Semester
   - Academic Session
3. Click "Upload Result"
4. The result will be uploaded to IPFS and submitted to blockchain
5. You'll receive a confirmation message

#### Batch Upload (CSV)

1. Prepare a CSV file with the following columns:
   - studentId
   - courseCode
   - courseTitle
   - grade
   - creditUnits
   - semester
   - academicSession

2. Navigate to "Upload Results"
3. Click "Choose File" under Batch Upload
4. Select your CSV file
5. The file will be processed automatically
6. You'll see a summary of processed and failed records

### Searching Students

1. Navigate to "Dashboard"
2. Use the search bar to find students
3. You can search by:
   - Name
   - Matric number
   - Wallet address
   - Department
   - Level

### Monitoring Transactions

1. Navigate to "Dashboard"
2. View recent results and their blockchain status
3. Status indicators:
   - Green "Confirmed" - Successfully on blockchain
   - Yellow "Pending" - Awaiting blockchain confirmation

### Viewing Audit Trail

1. Navigate to "Audit Trail" (Department Head and Registry Staff only)
2. View all system activities:
   - Uploads
   - Verifications
   - Modifications
   - Deletions
3. Filter by date, action type, or actor

## Public Verification Portal

### Manual Verification

1. Navigate to the Verification Portal
2. Select "Manual Verification"
3. Enter:
   - Student ID
   - Record Hash (IPFS Hash)
4. Click "Verify Record"
5. View the verification result:
   - Green checkmark for verified records
   - Red X for unverified records

### QR Code Verification

1. Navigate to the Verification Portal
2. Select "QR Code Scanner"
3. Allow camera access when prompted
4. Point your camera at the QR code
5. The system will automatically verify the record
6. View the verification result

### Verification Certificate

1. After verification, you'll see a verification certificate
2. The certificate includes:
   - Student information
   - Record details
   - Blockchain verification proof
   - Verification timestamp
3. Click "Download Certificate" to save as PDF

### Understanding Verification Results

**Verified Record:**
- Green checkmark indicator
- All record details displayed
- Blockchain transaction hash included
- Verification timestamp shown

**Unverified Record:**
- Red X indicator
- Record may not exist in the system
- Or blockchain verification failed
- Contact the institution for assistance

## Troubleshooting

### Wallet Connection Issues

- **Problem**: Wallet not connecting
  - **Solution**: Ensure you're using a compatible wallet (MetaMask, Trust Wallet, etc.)
  - Check browser permissions for wallet extension
  - Try refreshing the page

- **Problem**: Signature request not appearing
  - **Solution**: Check wallet extension is enabled
  - Ensure you're on the correct network (Polygon)

### Viewing Records Issues

- **Problem**: Records not loading
  - **Solution**: Check your internet connection
  - Ensure your wallet is connected
  - Try refreshing the page

- **Problem**: Verification status showing "Pending"
  - **Solution**: This is normal for newly uploaded records
  - Wait a few minutes for blockchain confirmation
  - Check back later

### Admin Panel Issues

- **Problem**: Can't log in
  - **Solution**: Verify your username and password
  - Check if your account is active
  - Contact system administrator

- **Problem**: Upload failing
  - **Solution**: Verify all required fields are filled
  - Check file format for CSV uploads
  - Ensure you have proper permissions

### Verification Issues

- **Problem**: QR code not scanning
  - **Solution**: Ensure good lighting
  - Hold camera steady
  - Check QR code is not damaged

- **Problem**: Verification returns "Not Verified"
  - **Solution**: Verify the student ID and record hash are correct
  - Check if the record exists in the system
  - Contact the institution if issue persists

## Support

For additional support:
- Email: support@uniben.edu.ng
- Phone: +234-xxx-xxx-xxxx
- Office Hours: Monday - Friday, 9:00 AM - 5:00 PM

