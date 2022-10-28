// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import "@openzeppelin/contracts/utils/Math/SafeMath.sol";

// Note: SafeMath is generally not needed starting with Solidity 0.8,
// since the compiler now has built in overflow checking.

/**
 * @title Tokenized Realty
 * @author Nic Smith
 * @dev Uses @chainlink/contracts 0.4.2.
 */
contract TokenizedRealty is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    bytes32 private immutable valuationSpecId;
    uint256 private immutable valuationFee;

    IERC20 private immutable usdToken;

    mapping(bytes32 => RequestInfo) public requestIdMap;

    error FailedTransferLINK(address to, uint256 amount);

    struct RequestInfo {
        uint256 propertyZip;
        uint256 holderIndex;
    }

    struct HoldingInfo {
        uint256 valueAtPurchase;
        uint256 amountPurchased;
        address purchaserAddress;
        uint256 debit;
        uint256 credit;
        bool claimed;
    }

    struct PropertyToken {
        address owner;
        uint256 tokenExpiry;
        uint256 totalAmount;
        uint256 amountAvailable;
        uint256 numberOfHolders;
        uint256 debit;
        uint256 credit;
        bool isUnlocked;
        bool claimed;
        mapping(uint256 => HoldingInfo) holders;
    }

    // Users address mapped to single PropertyToken instance
    mapping(uint256 => PropertyToken) public propertyTokens;

    uint256[] public propertyList;

    // The amount creation of property tokens must be over colaterised by
    uint256 private constant COLLATERALIZED_PERCENTAGE = 10;

    /* ========== CONSTRUCTOR ========== */
    /**
     * @param _link the LINK token address.
     * @param _oracle the Operator.sol contract address.
     */
    constructor(
        address _link,
        address _oracle,
        bytes32 _valuationSpecId,
        uint256 _valuationFee,
        address _usdAddress
    ) {
        setChainlinkToken(_link);
        setChainlinkOracle(_oracle);
        valuationSpecId = _valuationSpecId;
        valuationFee = _valuationFee;
        usdToken = IERC20(_usdAddress);
    }

    /* ========== PUBLIC FUNCTIONS ========== */

    function getCollateralAmount(uint256 _totalAmount)
        public
        pure
        returns (uint256)
    {
        return (_totalAmount * COLLATERALIZED_PERCENTAGE) / 100;
    }

    function getDoesPropertyIdExist(uint256 _propertyZip)
        public
        view
        returns (bool)
    {
        for (uint256 i = 0; i < propertyList.length; i++) {
            if (propertyList[i] == _propertyZip) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev
     * Creates a tokenized property instance.
     *
     * @param _propertyZip the id of the property
     * @param _tokenExpiry token life span
     * @param _totalAmount amount of value to tokenise
     */
    function createPropertyTokens(
        uint256 _propertyZip,
        uint256 _tokenExpiry,
        uint256 _totalAmount
    ) public {
        require(
            getDoesPropertyIdExist(_propertyZip) == false,
            "Property exists"
        );
        // Charge creator over colaterized amount for tokens
        uint256 collateral = getCollateralAmount(_totalAmount);
        usdToken.transferFrom(msg.sender, address(this), collateral);

        PropertyToken storage propertyToken = propertyTokens[_propertyZip];
        propertyToken.owner = msg.sender;
        propertyToken.tokenExpiry = _tokenExpiry;
        propertyToken.totalAmount = _totalAmount;
        propertyToken.amountAvailable = _totalAmount;
        propertyList.push(_propertyZip);
    }

    /**
     * @dev
     * Returns a list of tokenized property tokens.
     */
    function getPropertyTokenList() public view returns (uint256[] memory) {
        return propertyList;
    }

    /**
     * @dev
     * Returns Property Token values as array
     */
    function getPropertyToken(uint256 _propertyZip)
        public
        view
        returns (uint256[6] memory)
    {
        return [
            propertyTokens[_propertyZip].tokenExpiry,
            propertyTokens[_propertyZip].totalAmount,
            propertyTokens[_propertyZip].amountAvailable,
            propertyTokens[_propertyZip].numberOfHolders,
            propertyTokens[_propertyZip].debit,
            propertyTokens[_propertyZip].credit
        ];
    }

    /**
     * @dev
     * Allows a user to purchase a set amount of tokens from a
     * created tokenized property.
     *
     * @param _propertyZip the id of the property
     * @param _amount amount of value to tokenise
     */
    function purchasePropertyTokens(uint256 _propertyZip, uint256 _amount)
        public
    {
        PropertyToken storage propertyToken = propertyTokens[_propertyZip];

        require(propertyToken.amountAvailable >= _amount, "Not enough tokens");
        require(
            getHolderIndexForAddress(msg.sender, _propertyZip) == -1,
            "Holder already exists"
        );

        // Charge user for tokens
        usdToken.transferFrom(msg.sender, address(this), _amount);

        // Create the holder entry
        propertyToken.holders[propertyToken.numberOfHolders] = HoldingInfo({
            valueAtPurchase: 0, // This will get replaced by AVM
            amountPurchased: _amount,
            purchaserAddress: msg.sender,
            debit: 0,
            credit: 0,
            claimed: false
        });
        propertyToken.numberOfHolders = propertyToken.numberOfHolders + 1;
        propertyToken.amountAvailable = propertyToken.amountAvailable - _amount;
        // Get valuation of purchase
        getStartValuationForTokens(_propertyZip, propertyToken.numberOfHolders);
    }

    /**
     * @dev
     * Allows a user to claim tokens owed to them after
     * the tokens values have been reconciled
     *
     * @param _propertyZip the id of the property
     */
    function claimPropertyTokenEarnings(uint256 _propertyZip) public {
        PropertyToken storage propertyToken = propertyTokens[_propertyZip];
        require(propertyToken.isUnlocked, "Tokens are locked");
        // If claiming the creators tokens
        if (propertyToken.owner == msg.sender) {
            require(propertyToken.claimed == false, "No tokens to claim");
            uint256 collateral = getCollateralAmount(propertyToken.totalAmount);
            uint256 owing = collateral +
                propertyToken.credit -
                propertyToken.debit;
            require(owing > 0, "Balance is zero");
            usdToken.transfer(propertyToken.owner, owing);
            propertyToken.claimed = true;
        } else {
            if (getHolderIndexForAddress(msg.sender, _propertyZip) == -1) {
                revert("Caller not a holder");
            }
            uint256 i = uint256(
                getHolderIndexForAddress(msg.sender, _propertyZip)
            );
            require(
                propertyToken.holders[i].claimed == false,
                "Tokens already claimed"
            );
            // Once we users holding info
            uint256 amountPaid = propertyToken.holders[i].amountPurchased;
            uint256 owing = amountPaid +
                propertyToken.holders[i].credit -
                propertyToken.holders[i].debit;
            require(owing > 0, "Balance is zero");
            usdToken.transfer(propertyToken.holders[i].purchaserAddress, owing);
            propertyToken.holders[i].claimed = true;
        }
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
     * @dev
     * Helper function to calculate amount earned
     * Amount is capped so as not to exceed
     * COLLATERALIZED_PERCENTAGE
     *
     * @param _currentValuation the current value in usd
     * @param _holder the purchaser info
     */
    function getEarnings(uint256 _currentValuation, HoldingInfo memory _holder)
        internal
        pure
        returns (int256)
    {
        // Earned = ((ValueEnd - ValueStart) * AmountPurchased) / ValueStart)
        int256 difference = int256(
            (_currentValuation - _holder.valueAtPurchase)
        );

        int256 percentIncrease = (difference * 100) /
            int256(_holder.valueAtPurchase);

        // If increase is more that collateral, pay at collateral amount
        if (percentIncrease > int256(COLLATERALIZED_PERCENTAGE)) {
            return
                int256(
                    (_holder.amountPurchased * COLLATERALIZED_PERCENTAGE) / 100
                );
        }

        int256 multiplied = difference * int256(_holder.amountPurchased);

        return (multiplied / int256(_holder.valueAtPurchase));
    }

    /**
     * @dev
     * Called to start the valuation process off when tokens
     * are purchased.
     *
     * @param _propertyZip the id of the property
     * @param _holderIndex the index of the holder who purchased the tokens
     */
    function getStartValuationForTokens(
        uint256 _propertyZip,
        uint256 _holderIndex
    ) internal {
        Chainlink.Request memory req = buildChainlinkRequest(
            valuationSpecId,
            address(this),
            this.setStartValuationForTokens.selector
        );
        req.addUint("propertyZip", _propertyZip);
        req.addUint("timePeriod", 1); // Always get the last quarter
        bytes32 requestId = sendChainlinkRequest(req, valuationFee);
        requestIdMap[requestId] = RequestInfo({
            propertyZip: _propertyZip,
            holderIndex: _holderIndex - 1
        });
    }

    /**
     * @dev
     * Called to end the valuation process off when the tokens
     * have reached their end. No limit on who can call this
     *
     * @param _propertyZip the id of the property
     */
    function reconcilePropertyTokens(uint256 _propertyZip) public {
        require(getDoesPropertyIdExist(_propertyZip), "Not tokens found");
        require(
            // solhint-disable-next-line not-rely-on-time
            block.timestamp > propertyTokens[_propertyZip].tokenExpiry,
            "Tokens still active"
        );
        require(
            propertyTokens[_propertyZip].isUnlocked == false,
            "Tokens already reconciled"
        );
        Chainlink.Request memory req = buildChainlinkRequest(
            valuationSpecId,
            address(this),
            this.setEndValuationForTokens.selector
        );
        req.addUint("property_id", _propertyZip);
        bytes32 requestId = sendChainlinkRequest(req, valuationFee);
        requestIdMap[requestId] = RequestInfo({
            propertyZip: _propertyZip,
            holderIndex: 0 // holderIndex not used in this request
        });
    }

    /**
     * @dev
     * Used to get index of holder from address
     *
     * @param _holderAddress the address of the holder of the tokens
     * @param _propertyZip the id for the property of the tokens
     */
    function getHolderIndexForAddress(
        address _holderAddress,
        uint256 _propertyZip
    ) internal view returns (int256) {
        for (uint256 i; i < propertyTokens[_propertyZip].numberOfHolders; i++) {
            if (
                propertyTokens[_propertyZip].holders[i].purchaserAddress ==
                _holderAddress
            ) {
                return int256(i);
            }
        }
        return -1;
    }

    /* ========== EXTERNAL FUNCTIONS ========== */

    /**
     * @dev
     * Used to get Holder info from address
     *
     * @param _holderAddress the address of the holder of the tokens
     * @param _propertyZip the id for the property of the tokens
     */
    function getHolderForAddress(address _holderAddress, uint256 _propertyZip)
        external
        view
        returns (HoldingInfo memory)
    {
        int256 index = getHolderIndexForAddress(_holderAddress, _propertyZip);
        return propertyTokens[_propertyZip].holders[uint256(index)];
    }

    /**
     * @dev
     * Called by Oracle to set the AVM at purchase
     *
     * @param _requestId the id of the requested task
     * @param _valuation the estimated value of the house in USD
     */
    function setStartValuationForTokens(bytes32 _requestId, uint256 _valuation)
        external
        recordChainlinkFulfillment(_requestId)
    {
        uint256 propertyZip = requestIdMap[_requestId].propertyZip;
        uint256 holderIndex = requestIdMap[_requestId].holderIndex;
        PropertyToken storage propertyToken = propertyTokens[propertyZip];
        propertyToken.holders[holderIndex].valueAtPurchase = _valuation;
    }

    /**
     * @dev
     * Called by Oracle to set the AVM at the end
     *
     * @param _requestId the id of the requested task
     * @param _valuation the estimated value of the house in USD
     */
    function setEndValuationForTokens(bytes32 _requestId, uint256 _valuation)
        external
        recordChainlinkFulfillment(_requestId)
    {
        uint256 propertyZip = requestIdMap[_requestId].propertyZip;
        PropertyToken storage propertyToken = propertyTokens[propertyZip];
        int256 totalHoldersEarnings = 0;
        // For each holder
        for (uint256 i; i < propertyToken.numberOfHolders; i++) {
            int256 earned = getEarnings(
                _valuation,
                propertyTokens[propertyZip].holders[i]
            );
            if (earned > 0) {
                propertyTokens[propertyZip].holders[i].credit = uint256(earned);
            } else {
                propertyTokens[propertyZip].holders[i].debit = uint256(earned);
            }
            totalHoldersEarnings = totalHoldersEarnings + earned;
        }
        if (totalHoldersEarnings > 0) {
            propertyToken.debit = uint256(totalHoldersEarnings);
        } else {
            propertyToken.credit = uint256(totalHoldersEarnings);
        }
        propertyToken.isUnlocked = true;
    }

    /**
     *
     * @param _requestId the id of the requested task
     * @param _payment the fee for the request
     * @param _callbackFunctionId the callback id
     * @param _expiration the expiration
     */
    function cancelRequest(
        bytes32 _requestId,
        uint256 _payment,
        bytes4 _callbackFunctionId,
        uint256 _expiration
    ) external {
        cancelChainlinkRequest(
            _requestId,
            _payment,
            _callbackFunctionId,
            _expiration
        );
    }

    /**
     * @dev
     */
    function setOracle(address _oracle) external onlyOwner {
        setChainlinkOracle(_oracle);
    }

    /**
     * @dev
     */
    function getOracleAddress() external view returns (address) {
        return chainlinkOracleAddress();
    }

    /**
     * @dev
     */
    function withdrawLink(address payable _payee, uint256 _amount)
        external
        onlyOwner
    {
        LinkTokenInterface linkToken = LinkTokenInterface(
            chainlinkTokenAddress()
        );
        if (!linkToken.transfer(_payee, _amount)) {
            revert FailedTransferLINK(_payee, _amount);
        }
    }
}
