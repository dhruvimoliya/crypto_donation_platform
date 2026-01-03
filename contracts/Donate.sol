// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Donate {
    struct Campaign {
        uint256 id;
        string title;
        string description;
        address payable creator;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 createdAt;
        bool isActive;
    }

    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    uint256 public campaignCount;
    uint256 public totalDonated;
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation[]) public campaignDonations;
    mapping(address => uint256[]) public userCampaigns;
    
    event CampaignCreated(
        uint256 indexed campaignId,
        string title,
        address indexed creator,
        uint256 goalAmount
    );
    
    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount
    );
    
    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    // Create a new campaign
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goalAmount
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(_goalAmount > 0, "Goal must be greater than 0");

        campaignCount++;
        
        campaigns[campaignCount] = Campaign({
            id: campaignCount,
            title: _title,
            description: _description,
            creator: payable(msg.sender),
            goalAmount: _goalAmount,
            raisedAmount: 0,
            createdAt: block.timestamp,
            isActive: true
        });

        userCampaigns[msg.sender].push(campaignCount);

        emit CampaignCreated(campaignCount, _title, msg.sender, _goalAmount);
        
        return campaignCount;
    }

    // Donate to a campaign
    function donateToCampaign(uint256 _campaignId) public payable {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign");
        require(msg.value > 0, "Donation must be greater than 0");
        
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");

        campaign.raisedAmount += msg.value;
        totalDonated += msg.value;
        
        campaignDonations[_campaignId].push(Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }

    // Campaign creator withdraws funds
    function withdrawCampaignFunds(uint256 _campaignId) public {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign");
        
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only creator can withdraw");
        require(campaign.raisedAmount > 0, "No funds to withdraw");

        uint256 amount = campaign.raisedAmount;
        campaign.raisedAmount = 0;

        campaign.creator.transfer(amount);

        emit FundsWithdrawn(_campaignId, msg.sender, amount);
    }

    // Get campaign details
    function getCampaign(uint256 _campaignId) public view returns (
        uint256 id,
        string memory title,
        string memory description,
        address creator,
        uint256 goalAmount,
        uint256 raisedAmount,
        uint256 createdAt,
        bool isActive
    ) {
        Campaign memory campaign = campaigns[_campaignId];
        return (
            campaign.id,
            campaign.title,
            campaign.description,
            campaign.creator,
            campaign.goalAmount,
            campaign.raisedAmount,
            campaign.createdAt,
            campaign.isActive
        );
    }

    // Get all donations for a campaign
    function getCampaignDonations(uint256 _campaignId) public view returns (Donation[] memory) {
        return campaignDonations[_campaignId];
    }

    // Get all campaigns
    function getAllCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](campaignCount);
        
        for (uint256 i = 1; i <= campaignCount; i++) {
            allCampaigns[i - 1] = campaigns[i];
        }
        
        return allCampaigns;
    }

    // Toggle campaign status
    function toggleCampaignStatus(uint256 _campaignId) public {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign");
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only creator can toggle status");
        
        campaign.isActive = !campaign.isActive;
    }

    // Get campaigns by creator
    function getUserCampaigns(address _user) public view returns (uint256[] memory) {
        return userCampaigns[_user];
    }
}