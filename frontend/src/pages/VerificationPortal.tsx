import React, { useState, FormEvent, ChangeEvent } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface ManualData {
  studentId: string;
  recordHash: string;
}

interface VerificationResult {
  verified: boolean;
  student: {
    id: string;
    fullName: string;
    matricNumber: string;
    department: string;
  };
  record: {
    id: string;
    courseCode: string;
    courseTitle: string;
    grade: string;
    creditUnits: number;
    semester: string;
    academicSession: string;
    ipfsHash: string;
    blockchainTxHash?: string;
    blockchainConfirmed: boolean;
  };
  blockchainRecord?: {
    ipfsHash: string;
    metadataHash: string;
    timestamp: string;
    submittedBy: string;
    exists: boolean;
  };
  verificationTimestamp: string;
}

interface QRResult {
  text: string;
}

const VerificationPortal: React.FC = () => {
  const [verificationMethod, setVerificationMethod] = useState<'manual' | 'qr'>('manual');
  const [manualData, setManualData] = useState<ManualData>({
    studentId: '',
    recordHash: '',
  });
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleManualVerification = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post<VerificationResult>(`${API_URL}/verification/verify`, manualData);
      setVerificationResult(response.data);
      toast.success('Verification completed');
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.error || 'Verification failed');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (result: QRResult | null): void => {
    if (result) {
      try {
        const qrData = JSON.parse(result.text);
        setManualData({
          studentId: qrData.studentId,
          recordHash: qrData.recordHash,
        });
        setVerificationMethod('manual');
        handleManualVerification({ preventDefault: () => {} } as FormEvent<HTMLFormElement>);
      } catch (error: any) {
        console.error('QR scan error:', error);
        toast.error('Invalid QR code');
      }
    }
  };

  const downloadCertificate = (): void => {
    if (!verificationResult) return;

    const doc = new jsPDF();
    doc.text('Verification Certificate', 20, 20);
    doc.text(`Student: ${verificationResult.student.fullName}`, 20, 30);
    doc.text(`Matric Number: ${verificationResult.student.matricNumber}`, 20, 40);
    doc.text(`Course: ${verificationResult.record.courseCode} - ${verificationResult.record.courseTitle}`, 20, 50);
    doc.text(`Grade: ${verificationResult.record.grade}`, 20, 60);
    doc.text(`Verified: ${verificationResult.verified ? 'Yes' : 'No'}`, 20, 70);
    doc.text(`IPFS Hash: ${verificationResult.record.ipfsHash}`, 20, 80);
    if (verificationResult.record.blockchainTxHash) {
      doc.text(`Blockchain TX: ${verificationResult.record.blockchainTxHash}`, 20, 90);
    }
    doc.text(`Verification Date: ${verificationResult.verificationTimestamp}`, 20, 100);

    doc.save(`verification-certificate-${Date.now()}.pdf`);
    toast.success('Certificate downloaded');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Public Verification Portal</h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify Academic Record</h2>
            
            {/* Method Selection */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => {
                  setVerificationMethod('manual');
                  setVerificationResult(null);
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  verificationMethod === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Manual Verification
              </button>
              <button
                onClick={() => {
                  setVerificationMethod('qr');
                  setVerificationResult(null);
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  verificationMethod === 'qr'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                QR Code Scanner
              </button>
            </div>

            {/* Manual Verification Form */}
            {verificationMethod === 'manual' && (
              <form onSubmit={handleManualVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={manualData.studentId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setManualData({ ...manualData, studentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Record Hash (IPFS Hash)
                  </label>
                  <input
                    type="text"
                    value={manualData.recordHash}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setManualData({ ...manualData, recordHash: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Record'}
                </button>
              </form>
            )}

            {/* QR Code Scanner */}
            {verificationMethod === 'qr' && (
              <div className="space-y-4">
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  <QrReader
                    onResult={(result, error) => {
                      if (result) {
                        handleQRScan(result as QRResult);
                      }
                      if (error) {
                        console.error('QR scan error:', error);
                      }
                    }}
                    style={{ width: '100%' }}
                    constraints={{ facingMode: 'environment' }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Point your camera at the QR code to scan and verify
                </p>
              </div>
            )}
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Verification Result</h2>
                <button
                  onClick={downloadCertificate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download Certificate
                </button>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  verificationResult.verified
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {verificationResult.verified ? (
                      <>
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-lg font-semibold text-green-800">
                          Record Verified ✓
                        </span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-lg font-semibold text-red-800">
                          Record Not Verified ✗
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Student Information</h3>
                    <p className="text-sm text-gray-600">Name: {verificationResult.student.fullName}</p>
                    <p className="text-sm text-gray-600">Matric Number: {verificationResult.student.matricNumber}</p>
                    <p className="text-sm text-gray-600">Department: {verificationResult.student.department}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Record Details</h3>
                    <p className="text-sm text-gray-600">Course: {verificationResult.record.courseCode}</p>
                    <p className="text-sm text-gray-600">Title: {verificationResult.record.courseTitle}</p>
                    <p className="text-sm text-gray-600">Grade: {verificationResult.record.grade}</p>
                    <p className="text-sm text-gray-600">Credit Units: {verificationResult.record.creditUnits}</p>
                    <p className="text-sm text-gray-600">Semester: {verificationResult.record.semester}</p>
                    <p className="text-sm text-gray-600">Session: {verificationResult.record.academicSession}</p>
                  </div>
                </div>

                {verificationResult.blockchainRecord && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Blockchain Verification</h3>
                    <p className="text-xs text-gray-600 font-mono break-all">
                      IPFS Hash: {verificationResult.record.ipfsHash}
                    </p>
                    {verificationResult.record.blockchainTxHash && (
                      <p className="text-xs text-gray-600 font-mono break-all mt-2">
                        Transaction Hash: {verificationResult.record.blockchainTxHash}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      Verified on: {verificationResult.verificationTimestamp}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationPortal;

