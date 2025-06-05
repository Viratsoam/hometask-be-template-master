# Test Coverage Report

This document provides a detailed overview of the test coverage for the Deel Backend Task application.

## Current Coverage Status

```
----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------|---------|----------|---------|---------|-------------------
All files       |   80.29 |    73.33 |    90.9 |   80.91 |                   
 src            |     100 |       50 |     100 |     100 |                   
  model.js      |     100 |       50 |     100 |     100 | 3                 
 src/middleware |    90.9 |       75 |     100 |     100 |                   
  getProfile.js |    90.9 |       75 |     100 |     100 | 9                 
 src/routes     |   76.99 |    74.35 |      90 |   77.06 |                   
  admin.js      |      80 |    61.53 |     100 |   79.16 | 19-47,91          
  balances.js   |      75 |       70 |      50 |   77.77 | 18,26,54-60       
  contracts.js  |     100 |      100 |     100 |     100 |                   
  index.js      |       0 |      100 |     100 |       0 | 1-14              
  jobs.js       |   89.65 |       75 |     100 |   89.65 | 39,65,84          
----------------|---------|----------|---------|---------|-------------------
```

## Coverage Analysis

### Overall Metrics
- **Statements**: 80.29%
- **Branches**: 73.33%
- **Functions**: 90.9%
- **Lines**: 80.91%

### Component-wise Coverage

#### Models
- **model.js**: 100% coverage
  - All statements, functions, and lines are covered
  - Branch coverage at 50% (line 3)

#### Middleware
- **getProfile.js**: 90.9% coverage
  - High function and line coverage
  - Branch coverage at 75%
  - Uncovered line: 9

#### Routes
- **contracts.js**: 100% coverage
  - Perfect coverage across all metrics

- **jobs.js**: 89.65% coverage
  - High function coverage (100%)
  - Branch coverage at 75%
  - Uncovered lines: 39, 65, 84

- **admin.js**: 80% coverage
  - Full function coverage
  - Branch coverage at 61.53%
  - Uncovered lines: 19-47, 91

- **balances.js**: 75% coverage
  - Lower function coverage (50%)
  - Branch coverage at 70%
  - Uncovered lines: 18, 26, 54-60

- **index.js**: 0% coverage
  - No statement coverage
  - Uncovered lines: 1-14

## Running Tests with Coverage

To generate this coverage report:

```bash
npm test -- --coverage
```