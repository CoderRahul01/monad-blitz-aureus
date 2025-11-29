// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AureusEscrow {
    enum Status { LOCKED, RELEASED }

    struct Escrow {
        uint256 id;
        address payer;
        address provider;
        uint256 amount;
        Status status;
    }

    mapping(uint256 => Escrow) public escrows;
    uint256 public nextEscrowId;

    event EscrowCreated(uint256 indexed id, address indexed payer, address indexed provider, uint256 amount);
    event EscrowReleased(uint256 indexed id, address indexed provider, uint256 amount);

    function createEscrow(address _provider) external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        
        escrows[nextEscrowId] = Escrow({
            id: nextEscrowId,
            payer: msg.sender,
            provider: _provider,
            amount: msg.value,
            status: Status.LOCKED
        });

        emit EscrowCreated(nextEscrowId, msg.sender, _provider, msg.value);
        nextEscrowId++;
    }

    function releaseEscrow(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.payer, "Only payer can release");
        require(escrow.status == Status.LOCKED, "Escrow not locked");

        escrow.status = Status.RELEASED;
        (bool sent, ) = escrow.provider.call{value: escrow.amount}("");
        require(sent, "Failed to send Ether");

        emit EscrowReleased(_escrowId, escrow.provider, escrow.amount);
    }
}
