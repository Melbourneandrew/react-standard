Feature: Items Search
  As a user
  I want to search for items
  So that I can find specific items quickly

  Scenario: Search for items
    Given I am viewing items in a collection
    When  I type "foo" in the search input
    And   I wait for the debounce delay
    Then  the items list should filter to show only matching items
    And   the URL should contain the search query parameter

  Scenario: Clear search
    Given I am viewing filtered items with search query "foo"
    When  I clear the search input
    And   I wait for the debounce delay
    Then  all items should be displayed
    And   the search query parameter should be removed from the URL

  Scenario: Search with no results
    Given I am viewing items in a collection
    When  I search for "nonexistent item xyz"
    Then  I should see "No items found" message

  Scenario: Search persists on page refresh
    Given I have searched for "foo"
    When  I refresh the page
    Then  the search input should contain "foo"
    And   the items should be filtered by "foo"
