Feature: Item Edit
  As a user
  I want to edit existing items
  So that I can update item information

  Scenario: Open edit dialog
    Given I am viewing items in a collection
    When  I click the edit (pencil) button on an item
    Then  the item edit dialog should open
    And   the form should be pre-filled with the item's current data

  Scenario: Edit item successfully
    Given the item edit dialog is open for an item
    When  I change the name to "Updated Name"
    And   I change the description to "Updated description"
    And   I click the save button
    Then  the dialog should close
    And   the item should be updated in the list
    And   I should see a success toast notification

  Scenario: Cancel item edit
    Given the item edit dialog is open
    And   I have made changes
    When  I click the cancel button
    Then  the dialog should close
    And   the item should remain unchanged
