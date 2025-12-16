Feature: Item Creation
  As a user
  I want to create new items
  So that I can add content to my collection

  Scenario: Open create dialog
    Given I am viewing items in a collection
    When  I click the "+" button
    Then  the item creation dialog should open

  Scenario: Create item successfully
    Given the item creation dialog is open
    When  I enter "New Item" as the name
    And   I enter "Item description" as the description
    And   I click the create button
    Then  the dialog should close
    And   the new item should appear in the items list
    And   I should see a success toast notification

  Scenario: Create item with required fields only
    Given the item creation dialog is open
    When  I enter "New Item" as the name
    And   I leave the description empty
    And   I click the create button
    Then  the item should be created successfully

  Scenario: Cancel item creation
    Given the item creation dialog is open
    And   I have entered some data
    When  I click the cancel button
    Then  the dialog should close
    And   no item should be created
