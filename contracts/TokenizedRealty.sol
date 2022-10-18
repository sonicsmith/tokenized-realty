// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// import "@openzeppelin/contracts/utils/Math/SafeMath.sol";
// Note: SafeMath is generally not needed starting with Solidity 0.8,
// since the compiler now has built in overflow checking.

/**
 * @title A consumer contract for SmartZip API.
 * @author LinkPool.
 * @dev Uses @chainlink/contracts 0.4.2.
 */
contract TokenizedRealty is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    bytes32 private immutable valuationSpecId;
    uint256 private immutable valuationFee;

    mapping(bytes32 => RequestInfo) public requestIdMap;

    error FailedTransferLINK(address to, uint256 amount);

    struct RequestInfo {
        uint256 propertyId;
        uint256 holderIndex;
    }

    struct HoldingInfo {
        uint256 valueAtPurchase;
        uint256 amountPurchased;
        address purchaserAddress;
        int256 earnings;
    }

    struct PropertyToken {
        address owner;
        uint256 endDate;
        uint256 totalvalue;
        uint256 numberOfHolders;
        int256 earnings;
        mapping(uint256 => HoldingInfo) holders;
    }

    // Users address mapped to single PropertyToken instance
    mapping(uint256 => PropertyToken) public propertyTokens;

    uint256[] public propertyList;

    /* ========== CONSTRUCTOR ========== */
    /**
     * @param _link the LINK token address.
     * @param _oracle the Operator.sol contract address.
     */
    constructor(
        address _link,
        address _oracle,
        bytes32 _valuationSpecId,
        uint256 _valuationFee
    ) {
        setChainlinkToken(_link);
        setChainlinkOracle(_oracle);
        valuationSpecId = _valuationSpecId;
        valuationFee = _valuationFee;
    }

    /* ========== PUBLIC FUNCTIONS ========== */

    /**
     * @param _propertyId the id of the property
     * @param _endDate token life span
     * @param _totalvalue amount of value to tokenise
     */
    function createPropertyTokens(
        uint256 _propertyId,
        uint256 _endDate,
        uint256 _totalvalue
    ) public {
        PropertyToken storage propertyToken = propertyTokens[_propertyId];
        propertyToken.owner = msg.sender;
        propertyToken.endDate = _endDate;
        propertyToken.totalvalue = _totalvalue;
        propertyList.push(_propertyId);
    }

    /**
     * @param _propertyId the id of the property
     * @param _amount amount of value to tokenise
     */
    function purchasePropertyTokens(uint256 _propertyId, uint256 _amount)
        public
    {
        // TODO: Take amount from user
        PropertyToken storage propertyToken = propertyTokens[_propertyId];
        propertyToken.holders[propertyToken.numberOfHolders] = HoldingInfo({
            valueAtPurchase: 0, // This will get replaced by AVM
            amountPurchased: _amount,
            purchaserAddress: msg.sender,
            earnings: 0
        });
        propertyToken.numberOfHolders = propertyToken.numberOfHolders + 1;
        // Get valuation of purchase
        getStartValuationForTokens(_propertyId, propertyToken.numberOfHolders);
    }

    function claimPropertyTokenEarnings(uint256 _propertyId) public {
        PropertyToken storage propertyToken = propertyTokens[_propertyId];
        for (uint256 i; i < propertyToken.numberOfHolders; i++) {
            if (propertyToken.holders[i].purchaserAddress == msg.sender) {
                int256 earnings = int256(
                    propertyToken.holders[i].amountPurchased
                ) - propertyToken.holders[i].earnings;
                // TODO: Transfer USD
                // Reset earnings ?
                propertyToken.holders[i].earnings == 0;
            }
        }
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    function getEarnings(uint256 _valuation, HoldingInfo memory holder)
        internal
        pure
        returns (int256)
    {
        // Earned = ((ValueEnd - ValueStart) * AmountPurchased) / ValueStart)
        int256 difference = int256((_valuation - holder.valueAtPurchase));
        int256 multiplied = difference * int256(holder.amountPurchased);
        return (multiplied / int256(holder.valueAtPurchase));
    }

    /**
     * @param _propertyId the id of the property
     */
    function getStartValuationForTokens(
        uint256 _propertyId,
        uint256 _holderIndex
    ) internal {
        Chainlink.Request memory req = buildChainlinkRequest(
            valuationSpecId,
            address(this),
            this.setStartValuationForTokens.selector
        );
        req.addUint("property_id", _propertyId);
        bytes32 requestId = sendChainlinkRequest(req, valuationFee);
        requestIdMap[requestId] = RequestInfo({
            propertyId: _propertyId,
            holderIndex: _holderIndex
        });
    }

    /**
     * TODO: This should get called when property time has expired
     */
    function reconcilePropertyTokens(uint256 _propertyId) internal {
        Chainlink.Request memory req = buildChainlinkRequest(
            valuationSpecId,
            address(this),
            this.setEndValuationForTokens.selector
        );
        req.addUint("property_id", _propertyId);
        bytes32 requestId = sendChainlinkRequest(req, valuationFee);
        requestIdMap[requestId] = RequestInfo({
            propertyId: _propertyId,
            holderIndex: 0 // TODO: not using this, so is this ok?
        });
    }

    /* ========== EXTERNAL FUNCTIONS ========== */

    /**
     * @param _requestId the id of the requested task
     * @param _valuation the estimated value of the house in USD
     */
    function setStartValuationForTokens(bytes32 _requestId, uint256 _valuation)
        external
        recordChainlinkFulfillment(_requestId)
    {
        uint256 propertyId = requestIdMap[_requestId].propertyId;
        uint256 holderIndex = requestIdMap[_requestId].holderIndex;
        PropertyToken storage propertyToken = propertyTokens[propertyId];
        propertyToken.holders[holderIndex].valueAtPurchase = _valuation;
    }

    /**
     * @param _requestId the id of the requested task
     * @param _valuation the estimated value of the house in USD
     */
    function setEndValuationForTokens(bytes32 _requestId, uint256 _valuation)
        external
        recordChainlinkFulfillment(_requestId)
    {
        uint256 propertyId = requestIdMap[_requestId].propertyId;
        PropertyToken storage propertyToken = propertyTokens[propertyId];
        int256 totalHoldersEarnings = 0;
        // For each holder
        for (uint256 i; i < propertyToken.numberOfHolders; i++) {
            int256 earned = getEarnings(
                _valuation,
                propertyTokens[propertyId].holders[i]
            );
            totalHoldersEarnings = totalHoldersEarnings + earned;
        }
        propertyToken.earnings = totalHoldersEarnings;
    }

    /**
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

    function setOracle(address _oracle) external onlyOwner {
        setChainlinkOracle(_oracle);
    }

    function getOracleAddress() external view returns (address) {
        return chainlinkOracleAddress();
    }

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
