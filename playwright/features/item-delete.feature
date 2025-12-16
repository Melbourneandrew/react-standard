Feature: Item Delete
  As a user
  I want to delete items
  So that I can remove unwanted content

  Scenario: Open delete confirmation dialog
    Given I am viewing items in a collection
    When  I click the delete (trash) button on an item
    Then  the delete confirmation dialog should open
    And   I should see the item's name in the confirmation message

  Scenario: Confirm item deletion
    Given the delete confirmation dialog is open
    When  I click the confirm delete button
    Then  the dialog should close
    And   the item should be removed from the list
    And   I should see a success toast notification

  Scenario: Cancel item deletion
    Given the delete confirmation dialog is open
    When  I click the cancel button
    Then  the dialog should close
    And   the item should remain in the list
