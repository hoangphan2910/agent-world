// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Mock ERC-8183 AgenticCommerce
contract MockAgenticCommerce {
    uint256 private _nextJobId = 1;

    mapping(uint256 => address) public jobEvaluator;

    event JobCreated(uint256 indexed jobId, address provider, address evaluator);
    event BudgetSet(uint256 indexed jobId, uint256 amount);
    event Funded(uint256 indexed jobId);
    event Submitted(uint256 indexed jobId, bytes32 deliverableHash);
    event Completed(uint256 indexed jobId);

    function createJob(
        address provider,
        address evaluator,
        uint256 expiration,
        string calldata description,
        address hook
    ) external returns (uint256 jobId) {
        jobId = _nextJobId++;
        jobEvaluator[jobId] = evaluator;
        emit JobCreated(jobId, provider, evaluator);
    }

    function setBudget(uint256 jobId, uint256 amount, bytes calldata) external {
        emit BudgetSet(jobId, amount);
    }

    function fund(uint256 jobId, bytes calldata) external {
        emit Funded(jobId);
    }

    function submit(uint256 jobId, bytes32 deliverableHash, bytes calldata) external {
        emit Submitted(jobId, deliverableHash);
    }

    function complete(uint256 jobId, bytes32, bytes calldata) external {
        emit Completed(jobId);
    }
}
