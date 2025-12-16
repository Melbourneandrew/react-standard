Feature: Items Pagination
  As a user
  I want to paginate through items
  So that I can browse large collections efficiently

  Scenario: View pagination controls
    Given I am viewing a collection with more items than one page
    Then  I should see pagination controls
    And   I should see the current page number
    And   I should see the total pages

  Scenario: Navigate to next page
    Given I am on page 1 of items
    And   there are more pages available
    When  I click the "Next" button
    Then  I should see page 2 of items
    And   the URL should reflect page 2

  Scenario: Navigate to previous page
    Given I am on page 2 of items
    When  I click the "Previous" button
    Then  I should see page 1 of items
    And   the URL should reflect page 1

  Scenario: Previous button disabled on first page
    Given I am on page 1 of items
    Then  the "Previous" button should be disabled

  Scenario: Next button disabled on last page
    Given I am on the last page of items
    Then  the "Next" button should be disabled

  Scenario: No pagination for small collections
    Given I am viewing a collection with fewer items than one page
    Then  pagination controls should not be visible
