Feature: Items List
  As a user
  I want to view items in a collection
  So that I can see what items exist

  Scenario: View items in a collection
    Given I have selected a collection
    And   the collection has items
    When  the page loads
    Then  I should see a list of items
    And   each item should display its name
    And   each item should display its description if present

  Scenario: View empty collection
    Given I have selected a collection
    And   the collection has no items
    When  the page loads
    Then  I should see "No items found" message

  Scenario: View items count
    Given I have selected a collection
    And   the collection has 5 items
    When  the page loads
    Then  I should see "5 items" displayed

  Scenario: Loading state
    Given I have selected a collection
    When  the items are being fetched
    Then  I should see a loading spinner
