Feature: Collection Selection
  As a user
  I want to select a collection
  So that I can view and manage items within it

  Scenario: View welcome page
    Given I am on the home page
    Then  I should see a welcome card
    And   I should see a collection dropdown

  Scenario: Select a collection
    Given I am on the home page
    And   collections exist in the system
    When  I click the collection dropdown
    Then  I should see a list of available collections

  Scenario: Navigate to collection
    Given I am on the home page
    And   I have opened the collection dropdown
    When  I select a collection
    Then  I should be navigated to the collection's items page
    And   the URL should reflect the selected collection ID

  Scenario: Switch between collections
    Given I am viewing items in a collection
    When  I select a different collection from the navbar dropdown
    Then  I should be navigated to the new collection's items page
    And   the items list should update to show the new collection's items
