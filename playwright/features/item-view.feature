Feature: Item View
  As a user
  I want to view item details
  So that I can see full information about an item

  Scenario: Open view dialog
    Given I am viewing items in a collection
    When  I click the view (eye) button on an item
    Then  the item view dialog should open
    And   I should see the item's name
    And   I should see the item's description
    And   I should see the item's creation date
    And   I should see the item's last updated date

  Scenario: Close view dialog
    Given the item view dialog is open
    When  I click the close button
    Then  the dialog should close
