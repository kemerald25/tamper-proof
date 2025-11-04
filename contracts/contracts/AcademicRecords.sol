// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AcademicRecords
 * @dev Production-grade smart contract for storing and verifying academic records on Polygon
 * @notice This contract stores IPFS hashes of academic records linked to student wallet addresses
 */
contract AcademicRecords is Ownable, Pausable, ReentrancyGuard {
    // Struct to store academic record metadata
    struct Record {
        string ipfsHash;           // IPFS hash of the document
        string metadataHash;       // Hash of record metadata (course, grades, etc.)
        uint256 timestamp;         // Block timestamp when record was submitted
        address submittedBy;       // Faculty/admin address who submitted
        bool exists;               // Flag to check if record exists
    }

    // Mapping from student address to array of record hashes
    mapping(address => string[]) private studentRecords;
    
    // Mapping from student address to record hash to Record struct
    mapping(address => mapping(string => Record)) private records;
    
    // Mapping to track authorized faculty/admin addresses
    mapping(address => bool) public authorizedFaculty;
    
    // Mapping to track if a record hash exists for any student (for quick verification)
    mapping(string => bool) public recordHashExists;
    
    // Array to store all authorized faculty addresses
    address[] public facultyList;
    
    // Events
    event RecordSubmitted(
        address indexed studentAddress,
        string indexed ipfsHash,
        string metadataHash,
        address indexed submittedBy,
        uint256 timestamp
    );
    
    event FacultyAuthorized(address indexed facultyAddress, address indexed authorizedBy);
    event FacultyRevoked(address indexed facultyAddress, address indexed revokedBy);
    event VerificationRequested(
        address indexed studentAddress,
        string indexed recordHash,
        address indexed verifier
    );
    
    // Modifiers
    modifier onlyAuthorizedFaculty() {
        require(
            authorizedFaculty[msg.sender] || msg.sender == owner(),
            "AcademicRecords: Not authorized faculty"
        );
        _;
    }
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "AcademicRecords: Invalid address");
        _;
    }
    
    modifier validHash(string memory _hash) {
        require(bytes(_hash).length > 0, "AcademicRecords: Hash cannot be empty");
        _;
    }

    /**
     * @dev Constructor sets the deployer as owner and initializes the contract
     */
    constructor() Ownable(msg.sender) {
        // Owner is automatically authorized
        authorizedFaculty[msg.sender] = true;
        facultyList.push(msg.sender);
    }

    /**
     * @dev Submit a new academic record for a student
     * @param _studentAddress The wallet address of the student
     * @param _ipfsHash The IPFS hash of the academic record document
     * @param _metadataHash The hash of the record metadata (courses, grades, etc.)
     * @notice Only authorized faculty can submit records
     */
    function submitRecord(
        address _studentAddress,
        string memory _ipfsHash,
        string memory _metadataHash
    )
        external
        onlyAuthorizedFaculty
        whenNotPaused
        nonReentrant
        validAddress(_studentAddress)
        validHash(_ipfsHash)
        validHash(_metadataHash)
    {
        // Check if record already exists
        require(
            !records[_studentAddress][_ipfsHash].exists,
            "AcademicRecords: Record already exists"
        );

        // Create new record
        Record memory newRecord = Record({
            ipfsHash: _ipfsHash,
            metadataHash: _metadataHash,
            timestamp: block.timestamp,
            submittedBy: msg.sender,
            exists: true
        });

        // Store the record
        records[_studentAddress][_ipfsHash] = newRecord;
        studentRecords[_studentAddress].push(_ipfsHash);
        recordHashExists[_ipfsHash] = true;

        // Emit event
        emit RecordSubmitted(
            _studentAddress,
            _ipfsHash,
            _metadataHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Submit multiple records in a single transaction (batch operation)
     * @param _studentAddresses Array of student wallet addresses
     * @param _ipfsHashes Array of IPFS hashes corresponding to each student
     * @param _metadataHashes Array of metadata hashes corresponding to each student
     * @notice Gas-efficient batch submission for multiple records
     */
    function batchSubmitRecords(
        address[] memory _studentAddresses,
        string[] memory _ipfsHashes,
        string[] memory _metadataHashes
    )
        external
        onlyAuthorizedFaculty
        whenNotPaused
        nonReentrant
    {
        require(
            _studentAddresses.length == _ipfsHashes.length &&
            _ipfsHashes.length == _metadataHashes.length,
            "AcademicRecords: Array length mismatch"
        );
        require(_studentAddresses.length > 0, "AcademicRecords: Empty array");

        for (uint256 i = 0; i < _studentAddresses.length; i++) {
            require(
                _studentAddresses[i] != address(0),
                "AcademicRecords: Invalid student address"
            );
            require(
                bytes(_ipfsHashes[i]).length > 0 && bytes(_metadataHashes[i]).length > 0,
                "AcademicRecords: Empty hash"
            );
            require(
                !records[_studentAddresses[i]][_ipfsHashes[i]].exists,
                "AcademicRecords: Record already exists"
            );

            Record memory newRecord = Record({
                ipfsHash: _ipfsHashes[i],
                metadataHash: _metadataHashes[i],
                timestamp: block.timestamp,
                submittedBy: msg.sender,
                exists: true
            });

            records[_studentAddresses[i]][_ipfsHashes[i]] = newRecord;
            studentRecords[_studentAddresses[i]].push(_ipfsHashes[i]);
            recordHashExists[_ipfsHashes[i]] = true;

            emit RecordSubmitted(
                _studentAddresses[i],
                _ipfsHashes[i],
                _metadataHashes[i],
                msg.sender,
                block.timestamp
            );
        }
    }

    /**
     * @dev Retrieve a specific record for a student
     * @param _studentAddress The wallet address of the student
     * @param _ipfsHash The IPFS hash of the record to retrieve
     * @return Record struct containing record details
     */
    function getRecord(
        address _studentAddress,
        string memory _ipfsHash
    )
        external
        view
        validAddress(_studentAddress)
        validHash(_ipfsHash)
        returns (Record memory)
    {
        require(
            records[_studentAddress][_ipfsHash].exists,
            "AcademicRecords: Record does not exist"
        );
        return records[_studentAddress][_ipfsHash];
    }

    /**
     * @dev Get all record hashes for a student
     * @param _studentAddress The wallet address of the student
     * @return Array of IPFS hashes for all records of the student
     */
    function getStudentRecords(
        address _studentAddress
    )
        external
        view
        validAddress(_studentAddress)
        returns (string[] memory)
    {
        return studentRecords[_studentAddress];
    }

    /**
     * @dev Verify if a record hash exists for a student
     * @param _studentAddress The wallet address of the student
     * @param _ipfsHash The IPFS hash to verify
     * @return bool True if record exists, false otherwise
     */
    function verifyRecord(
        address _studentAddress,
        string memory _ipfsHash
    )
        external
        view
        validAddress(_studentAddress)
        validHash(_ipfsHash)
        returns (bool)
    {
        emit VerificationRequested(_studentAddress, _ipfsHash, msg.sender);
        return records[_studentAddress][_ipfsHash].exists;
    }

    /**
     * @dev Check if a record hash exists globally (for quick verification)
     * @param _ipfsHash The IPFS hash to check
     * @return bool True if hash exists anywhere in the system
     */
    function recordHashExistsCheck(string memory _ipfsHash) external view returns (bool) {
        return recordHashExists[_ipfsHash];
    }

    /**
     * @dev Authorize a faculty member to submit records
     * @param _facultyAddress The wallet address of the faculty member
     * @notice Only owner can authorize faculty
     */
    function authorizeFaculty(
        address _facultyAddress
    ) external onlyOwner validAddress(_facultyAddress) {
        require(
            !authorizedFaculty[_facultyAddress],
            "AcademicRecords: Faculty already authorized"
        );

        authorizedFaculty[_facultyAddress] = true;
        facultyList.push(_facultyAddress);

        emit FacultyAuthorized(_facultyAddress, msg.sender);
    }

    /**
     * @dev Revoke authorization from a faculty member
     * @param _facultyAddress The wallet address of the faculty member
     * @notice Only owner can revoke authorization
     */
    function revokeFaculty(
        address _facultyAddress
    ) external onlyOwner validAddress(_facultyAddress) {
        require(
            authorizedFaculty[_facultyAddress],
            "AcademicRecords: Faculty not authorized"
        );

        authorizedFaculty[_facultyAddress] = false;

        // Remove from faculty list (keep array for gas efficiency, just mark as removed)
        emit FacultyRevoked(_facultyAddress, msg.sender);
    }

    /**
     * @dev Get list of all authorized faculty addresses
     * @return Array of authorized faculty addresses
     */
    function getAuthorizedFaculty() external view returns (address[] memory) {
        return facultyList;
    }

    /**
     * @dev Check if an address is authorized faculty
     * @param _address The address to check
     * @return bool True if authorized, false otherwise
     */
    function isAuthorizedFaculty(address _address) external view returns (bool) {
        return authorizedFaculty[_address] || _address == owner();
    }

    /**
     * @dev Pause the contract in case of emergency
     * @notice Only owner can pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     * @notice Only owner can unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get total number of records for a student
     * @param _studentAddress The wallet address of the student
     * @return uint256 Number of records
     */
    function getRecordCount(address _studentAddress) external view returns (uint256) {
        return studentRecords[_studentAddress].length;
    }
}

