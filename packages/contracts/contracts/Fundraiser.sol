// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./libraries/CircuitBreaker.sol";

/**
 * @title Fundraiser
 * @dev Campaign Contract
 * Features: Donations, Voting, Proposals, Media Archives, Refunds, Circuit Breaker.
 */
contract Fundraiser is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;
    using CircuitBreaker for CircuitBreaker.BreakerConfig;

    // --- Structs (Restored) ---
    struct Donation {
        uint256 value;
        uint256 date;
        address token;
        string sourceChain;
    }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 date;
        uint256 upvotes;
        uint256 downvotes;
        uint256 requiredVotes;
        bool executed;
        bool exists;
    }

    struct MediaArchive {
        uint256 id;
        string title;
        string description;
        string url;
        string verificationType;
        uint256 date;
        bool verified;
    }

    struct AllDonation {
        address donor;
        uint256 value;
        uint256 date;
        address token;
        string sourceChain;
    }

    // --- State Mappings ---
    mapping(address => Donation[]) private _donations;
    mapping(uint256 => AllDonation[]) private _allDonations;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => MediaArchive) public mediaArchives;
    mapping(address => bool) public _donors;
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    mapping(address => uint256) public donorVotingPower;

    // --- Configuration ---
    IERC20 public usdc; 
    address public factoryAddress;
    address public platformFeeRecipient;

    // --- Events ---
    event DonationCredited(address indexed donor, uint256 amount, string sourceChain);
    event ProposalCreated(uint256 id, string title, uint256 requiredVotes);
    event Voted(uint256 id, address indexed voter, bool upvote);
    event ProposalExecuted(uint256 id);
    event MediaArchiveCreated(uint256 id, string title, string url, bool verified);
    event Withdraw(uint256 amount, address token);
    event RefundClaimed(address indexed donor, uint256 amount);
    event RefundsEnabled(uint256 timestamp);

    // --- State Variables ---
    uint256 public id;
    string public name;
    string[] public images;
    string[] public categories;
    string public description;
    string public region;
    address payable public beneficiary;
    
    uint256 public totalDonations;
    uint256 public totalDonationsCount;
    uint256 public proposalCount;
    uint256 public mediaArchiveCount;
    uint256 public donationsCount;
    uint256 public goal;
    uint256 public deadline;

    // --- Refund State ---
    bool public refundsEnabled;
    mapping(address => uint256) public donorDonations;
    uint256 public donorsCount;

    // --- Circuit Breaker ---
    CircuitBreaker.BreakerConfig private circuitBreaker;

    // --- Constructor (Locks Implementation) ---
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // --- Initialize (Replaces Constructor for Clones) ---
    function initialize(
        uint256 _id,
        string memory _name,
        string[] memory _images,
        string[] memory _categories,
        string memory _description,
        string memory _region,
        address payable _beneficiary,
        address _creator,
        uint256 _goal,
        uint256 _deadline,
        address _usdc,
        address _platformFeeRecipient,
        address _factoryAddress
    ) external initializer {
        __Ownable_init(_creator);
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        // Init State
        id = _id;
        name = _name;
        images = _images;
        categories = _categories;
        description = _description;
        region = _region;
        beneficiary = _beneficiary;
        goal = _goal;
        deadline = _deadline;
        usdc = IERC20(_usdc);
        platformFeeRecipient = _platformFeeRecipient;
        factoryAddress = _factoryAddress;

        // Initialize circuit breaker with default limits
        // Max single: 1M USDC, Max hourly: 5M USDC, Max daily: 20M USDC
        circuitBreaker.initialize(
            1_000_000 * 10 ** 6, // 1M USDC max single transaction
            5_000_000 * 10 ** 6, // 5M USDC max hourly volume
            20_000_000 * 10 ** 6 // 20M USDC max daily volume
        );
    }

    // --- Modifiers ---
    modifier onlyFactory() {
        require(msg.sender == factoryAddress, "Fundraiser: Caller is not the factory");
        _;
    }

    modifier onlyDonor() {
        require(_donors[msg.sender], "Only donors can perform this action");
        _;
    }

    modifier beforeDeadline() {
        require(block.timestamp < deadline, "Fundraiser has ended");
        _;
    }

    // --- Core Donation Logic ---

    /**
     * @dev Credits a donation. Called by Factory (Native/ERC20/CrossChain).
     * Matches the signature called in FundraiserFactory.sol
     */
    function creditDonation(
        address donor,
        uint256 amount,
        string memory sourceChain
    ) external nonReentrant whenNotPaused onlyFactory beforeDeadline {
        // Check circuit breaker
        require(!circuitBreaker.isTriggered(), "Circuit breaker triggered");
        require(circuitBreaker.checkTransaction(amount), "Transaction blocked by circuit breaker");

        _recordDonation(donor, amount, address(usdc), sourceChain);
        emit DonationCredited(donor, amount, sourceChain);
    }

    function goalReached() public view returns (bool) {
        return totalDonations >= goal;
    }

    function _recordDonation(
        address donor,
        uint256 value,
        address token,
        string memory sourceChain
    ) private {
        Donation memory donation = Donation({
            value: value,
            date: block.timestamp,
            token: token,
            sourceChain: sourceChain
        });

        AllDonation memory allDonation = AllDonation({
            donor: donor,
            value: value,
            date: block.timestamp,
            token: token,
            sourceChain: sourceChain
        });

        _donations[donor].push(donation);
        _allDonations[id].push(allDonation);

        totalDonations += value;
        donationsCount++;
        totalDonationsCount++;

        // Track donor donation amount for refunds
        if (!_donors[donor]) {
            _donors[donor] = true;
            donorsCount++;
        }
        donorDonations[donor] += value;

        // Voting power increases with donation
        donorVotingPower[donor] += value;
    }

    // --- Proposal Functions (Restored) ---

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _requiredVotes
    ) external onlyOwner {
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: _title,
            description: _description,
            date: block.timestamp,
            upvotes: 0,
            downvotes: 0,
            requiredVotes: _requiredVotes,
            executed: false,
            exists: true
        });
        emit ProposalCreated(proposalCount, _title, _requiredVotes);
    }

    function vote(uint256 _id, bool _upvote) external onlyDonor {
        Proposal storage proposal = proposals[_id];
        require(proposal.exists, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!hasVoted[msg.sender][_id], "Already voted");

        uint256 votingPower = donorVotingPower[msg.sender];
        require(votingPower > 0, "No voting power");

        if (_upvote) {
            proposal.upvotes += votingPower;
        } else {
            proposal.downvotes += votingPower;
        }

        hasVoted[msg.sender][_id] = true;
        emit Voted(_id, msg.sender, _upvote);
    }

    function executeProposal(uint256 _id) external onlyOwner {
        Proposal storage proposal = proposals[_id];
        require(proposal.exists, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(proposal.upvotes >= proposal.requiredVotes, "Not enough votes");

        proposal.executed = true;
        emit ProposalExecuted(_id);
    }

    function getProposals() external view returns (Proposal[] memory) {
        Proposal[] memory allProposals = new Proposal[](proposalCount);
        for (uint256 i = 1; i <= proposalCount; i++) {
            allProposals[i - 1] = proposals[i];
        }
        return allProposals;
    }

    // --- Media Archive Functions (Restored) ---

    function createMediaArchive(
        string memory _title,
        string memory _description,
        string memory _url,
        string memory _verificationType,
        bool _verified
    ) external onlyOwner {
        mediaArchiveCount++;
        mediaArchives[mediaArchiveCount] = MediaArchive({
            id: mediaArchiveCount,
            title: _title,
            description: _description,
            url: _url,
            verificationType: _verificationType,
            date: block.timestamp,
            verified: _verified
        });
        emit MediaArchiveCreated(mediaArchiveCount, _title, _url, _verified);
    }

    function getMediaArchive() external view returns (MediaArchive[] memory) {
        MediaArchive[] memory allMediaArchives = new MediaArchive[](mediaArchiveCount);
        for (uint256 i = 1; i <= mediaArchiveCount; i++) {
            allMediaArchives[i - 1] = mediaArchives[i];
        }
        return allMediaArchives;
    }

    // --- Query Functions ---

    function myDonationsCount() external view returns (uint256) {
        return _donations[msg.sender].length;
    }

    function allDonationsCount() external view returns (uint256) {
        return _allDonations[id].length;
    }

    function myDonations() external view returns (
        uint256[] memory values,
        uint256[] memory dates,
        address[] memory tokens,
        string[] memory sourceChains
    ) {
        uint256 count = _donations[msg.sender].length;
        values = new uint256[](count);
        dates = new uint256[](count);
        tokens = new address[](count);
        sourceChains = new string[](count);

        for (uint256 i = 0; i < count; i++) {
            Donation storage donation = _donations[msg.sender][i];
            values[i] = donation.value;
            dates[i] = donation.date;
            tokens[i] = donation.token;
            sourceChains[i] = donation.sourceChain;
        }
        return (values, dates, tokens, sourceChains);
    }

    function allDonations() external view returns (
        address[] memory donors,
        uint256[] memory values,
        uint256[] memory dates,
        address[] memory tokens
    ) {
        uint256 count = _allDonations[id].length;
        donors = new address[](count);
        values = new uint256[](count);
        dates = new uint256[](count);
        tokens = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            AllDonation storage donation = _allDonations[id][i];
            donors[i] = donation.donor;
            values[i] = donation.value;
            dates[i] = donation.date;
            tokens[i] = donation.token;
        }
        return (donors, values, dates, tokens);
    }

    function getImageUrls() external view returns (string[] memory) {
        return images;
    }

    function getCategories() external view returns (string[] memory) {
        return categories;
    }

    function getFundraiserStats() external view returns (
        uint256 _totalDonations,
        uint256 _totalDonationsCount,
        uint256 _goal,
        uint256 _deadline,
        bool _isActive
    ) {
        return (
            totalDonations,
            totalDonationsCount,
            goal,
            deadline,
            block.timestamp < deadline
        );
    }

    // --- Admin Functions ---

    function setBeneficiary(address payable _beneficiary) external onlyOwner {
        require(_beneficiary != address(0), "Invalid address");
        beneficiary = _beneficiary;
    }

    function extendDeadline(uint256 newDeadline) external onlyOwner {
        require(newDeadline > deadline, "New deadline must be later");
        deadline = newDeadline;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawUSDT() external onlyOwner nonReentrant {
        require(!refundsEnabled, "Refunds are enabled, cannot withdraw");
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        usdc.safeTransfer(beneficiary, balance);
        emit Withdraw(balance, address(usdc));
    }

    // --- Refund Functions ---

    /**
     * @notice Enable refunds if fundraiser failed to reach goal
     * @dev Can only be called after deadline if goal not reached
     */
    function enableRefunds() external {
        require(block.timestamp > deadline, "Fundraiser not ended");
        require(!goalReached(), "Goal was reached");
        require(!refundsEnabled, "Refunds already enabled");

        refundsEnabled = true;
        emit RefundsEnabled(block.timestamp);
    }

    /**
     * @notice Claim refund for donations if fundraiser failed
     * @dev Only available if refunds are enabled (goal not reached)
     */
    function claimRefund() external nonReentrant {
        require(refundsEnabled, "Refunds not enabled");
        require(donorDonations[msg.sender] > 0, "No donations to refund");

        uint256 refundAmount = donorDonations[msg.sender];
        donorDonations[msg.sender] = 0;

        // Update donor tracking
        if (_donors[msg.sender]) {
            _donors[msg.sender] = false;
            if (donorsCount > 0) {
                donorsCount--;
            }
        }

        usdc.safeTransfer(msg.sender, refundAmount);

        emit RefundClaimed(msg.sender, refundAmount);
    }

    /**
     * @notice Check how much a donor can claim as refund
     * @param donor Address of the donor
     * @return Amount available for refund
     */
    function getRefundAmount(address donor) external view returns (uint256) {
        if (!refundsEnabled) return 0;
        return donorDonations[donor];
    }

    // --- Circuit Breaker Functions ---

    /**
     * @notice Reset the circuit breaker after investigation
     * @dev Only owner can reset. Use with caution.
     */
    function resetCircuitBreaker() external onlyOwner {
        circuitBreaker.reset();
    }

    /**
     * @notice Update circuit breaker limits
     * @param maxTransaction Maximum single transaction amount
     * @param maxHourly Maximum hourly volume
     * @param maxDaily Maximum daily volume
     */
    function updateCircuitBreakerLimits(
        uint256 maxTransaction,
        uint256 maxHourly,
        uint256 maxDaily
    ) external onlyOwner {
        circuitBreaker.updateLimits(maxTransaction, maxHourly, maxDaily);
    }

    /**
     * @notice Check if circuit breaker is triggered
     * @return True if circuit breaker is triggered
     */
    function isCircuitBreakerTriggered() external view returns (bool) {
        return circuitBreaker.isTriggered();
    }

    /**
     * @notice Get remaining transaction capacity
     * @return maxSingle Maximum single transaction allowed
     * @return hourlyRemaining Remaining hourly capacity
     * @return dailyRemaining Remaining daily capacity
     */
    function getCircuitBreakerStatus()
        external
        view
        returns (
            uint256 maxSingle,
            uint256 hourlyRemaining,
            uint256 dailyRemaining
        )
    {
        return (
            circuitBreaker.getMaxTransactionAmount(),
            circuitBreaker.getRemainingHourlyCapacity(),
            circuitBreaker.getRemainingDailyCapacity()
        );
    }

    // --- UUPS Upgrade Authorization ---

    /**
     * @notice Authorize contract upgrades
     * @param newImplementation Address of the new implementation
     * @dev Only owner can authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function version() external pure returns (string memory) {
        return "1.1.0";
    }
}