let web3;
let contract;
const contractAddress = "<INSERT YOUR CONTRACT ADDRESS HERE>";

const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256"},
            {"indexed": false, "internalType": "string", "name": "title", "type": "string"},
            {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "goalAmount", "type": "uint256"}
        ],
        "name": "CampaignCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256"},
            {"indexed": true, "internalType": "address", "name": "donor", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "DonationReceived",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256"},
            {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "FundsWithdrawn",
        "type": "event"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_title", "type": "string"},
            {"internalType": "string", "name": "_description", "type": "string"},
            {"internalType": "uint256", "name": "_goalAmount", "type": "uint256"}
        ],
        "name": "createCampaign",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}],
        "name": "donateToCampaign",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}],
        "name": "withdrawCampaignFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}],
        "name": "getCampaign",
        "outputs": [
            {"internalType": "uint256", "name": "id", "type": "uint256"},
            {"internalType": "string", "name": "title", "type": "string"},
            {"internalType": "string", "name": "description", "type": "string"},
            {"internalType": "address", "name": "creator", "type": "address"},
            {"internalType": "uint256", "name": "goalAmount", "type": "uint256"},
            {"internalType": "uint256", "name": "raisedAmount", "type": "uint256"},
            {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
            {"internalType": "bool", "name": "isActive", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAllCampaigns",
        "outputs": [
            {
                "components": [
                    {"internalType": "uint256", "name": "id", "type": "uint256"},
                    {"internalType": "string", "name": "title", "type": "string"},
                    {"internalType": "string", "name": "description", "type": "string"},
                    {"internalType": "address payable", "name": "creator", "type": "address"},
                    {"internalType": "uint256", "name": "goalAmount", "type": "uint256"},
                    {"internalType": "uint256", "name": "raisedAmount", "type": "uint256"},
                    {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
                    {"internalType": "bool", "name": "isActive", "type": "bool"}
                ],
                "internalType": "struct Donate.Campaign[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "campaignCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalDonated",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Install MetaMask from metamask.io');
        return;
    }
    
    try {
        web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        contract = new web3.eth.Contract(contractABI, contractAddress);
        
        const shortAddr = accounts[0].substring(0, 6) + '...' + accounts[0].substring(38);
        document.getElementById('accountInfo').textContent = shortAddr;
        
        const code = await web3.eth.getCode(contractAddress);
        if (code === '0x') {
            alert('Contract not found. Update contractAddress in app.js');
            return;
        }
        
        loadCampaigns();
        updateStats();
        console.log('Connected:', accounts[0]);
    } catch (error) {
        console.error(error);
        alert('Connection failed: ' + error.message);
    }
}

async function createCampaign() {
    const title = document.getElementById('campaignTitle').value.trim();
    const description = document.getElementById('campaignDesc').value.trim();
    const goal = document.getElementById('campaignGoal').value;
    
    if (!title || !description || !goal || goal <= 0) {
        alert('Fill all fields with valid data');
        return;
    }
    
    if (!web3 || !contract) {
        alert('Connect wallet first');
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        const goalWei = web3.utils.toWei(goal, 'ether');

        const gas = await contract.methods
            .createCampaign(title, description, goalWei)
            .estimateGas({ from: accounts[0] });

        await contract.methods
            .createCampaign(title, description, goalWei)
            .send({ 
                from: accounts[0],
                gas: Math.floor(gas * 1.2)
            });
        
        alert('Campaign created successfully');
        document.getElementById('campaignTitle').value = '';
        document.getElementById('campaignDesc').value = '';
        document.getElementById('campaignGoal').value = '';
        
        loadCampaigns();
        updateStats();
    } catch (err) {
        console.error(err);
        alert('Failed: ' + err.message);
    }
}

async function loadCampaigns() {
    if (!web3 || !contract) return;
    
    try {
        const campaigns = await contract.methods.getAllCampaigns().call();
        const list = document.getElementById('campaignList');
        list.innerHTML = '';
        
        if (campaigns.length === 0) {
            list.innerHTML = '<div class="empty-state">No campaigns yet</div>';
            return;
        }
        
        const activeCampaigns = campaigns.filter(c => c.isActive);
        
        if (activeCampaigns.length === 0) {
            list.innerHTML = '<div class="empty-state">No active campaigns</div>';
            return;
        }
        
        for (let c of activeCampaigns) {
            const goalETH = web3.utils.fromWei(c.goalAmount, 'ether');
            const raisedETH = web3.utils.fromWei(c.raisedAmount, 'ether');
            const pct = (parseFloat(raisedETH) / parseFloat(goalETH) * 100).toFixed(0);
            
            const div = document.createElement('div');
            div.className = 'campaign';
            div.innerHTML = `
                <h3>${escapeHtml(c.title)}</h3>
                <p class="campaign-desc">${escapeHtml(c.description)}</p>
                <p class="campaign-meta">by ${c.creator.substring(0, 8)}...</p>
                <div class="progress">
                    <div class="progress-bar" style="width: ${Math.min(pct, 100)}%"></div>
                </div>
                <p class="campaign-stats">${raisedETH} ETH raised of ${goalETH} ETH (${pct}%)</p>
                <div class="campaign-actions">
                    <input type="number" id="amount-${c.id}" placeholder="Amount (ETH)" step="0.01" min="0.001">
                    <button class="btn-small" onclick="donate(${c.id})">Donate</button>
                    <button class="btn-small btn-secondary" onclick="withdraw(${c.id})">Withdraw</button>
                </div>
            `;
            list.appendChild(div);
        }
    } catch (err) {
        console.error(err);
        alert('Failed to load campaigns');
    }
}

async function donate(id) {
    const input = document.getElementById(`amount-${id}`);
    const amount = input.value;
    
    if (!amount || amount <= 0) {
        alert('Enter a valid amount');
        return;
    }
    
    if (!web3 || !contract) {
        alert('Connect wallet first');
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        const amountWei = web3.utils.toWei(amount, 'ether');

        const gas = await contract.methods
            .donateToCampaign(id)
            .estimateGas({ from: accounts[0], value: amountWei });

        await contract.methods
            .donateToCampaign(id)
            .send({ 
                from: accounts[0], 
                value: amountWei,
                gas: Math.floor(gas * 1.2)
            });
        
        alert('Donation sent successfully');
        input.value = '';
        
        setTimeout(() => {
            loadCampaigns();
            updateStats();
        }, 1000);
    } catch (err) {
        console.error(err);
        alert('Donation failed: ' + err.message);
    }
}

async function withdraw(id) {
    if (!web3 || !contract) {
        alert('Connect wallet first');
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        const campaign = await contract.methods.getCampaign(id).call();
        
        if (campaign.creator.toLowerCase() !== accounts[0].toLowerCase()) {
            alert('Only the campaign creator can withdraw funds');
            return;
        }
        
        if (campaign.raisedAmount == 0) {
            alert('No funds available to withdraw');
            return;
        }

        const gas = await contract.methods
            .withdrawCampaignFunds(id)
            .estimateGas({ from: accounts[0] });

        await contract.methods
            .withdrawCampaignFunds(id)
            .send({ 
                from: accounts[0],
                gas: Math.floor(gas * 1.2)
            });
        
        alert('Funds withdrawn successfully');
        
        setTimeout(() => {
            loadCampaigns();
            updateStats();
        }, 1000);
    } catch (err) {
        console.error(err);
        alert('Withdrawal failed: ' + err.message);
    }
}

async function updateStats() {
    if (!web3 || !contract) return;
    
    try {
        const total = await contract.methods.totalDonated().call();
        const count = await contract.methods.campaignCount().call();
        
        const totalETH = web3.utils.fromWei(total, 'ether');
        document.getElementById('totalDonated').textContent = totalETH + ' ETH';
        document.getElementById('campaignCount').textContent = count;
    } catch (err) {
        console.error(err);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}