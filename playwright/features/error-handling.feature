Feature: Error Handling
  As a user
  I want to see meaningful error messages
  So that I understand when something goes wrong

  Scenario: API error on items fetch
    Given I have selected a collection
    And   the API returns an error
    When  the page loads
    Then  I should see an error message

  Scenario: API error on item creation
    Given the item creation dialog is open
    And   I have filled in valid data
    And   the API will return an error
    When  I click the create button
    Then  I should see an error toast notification
    And   the dialog should remain open

  Scenario: Collection not found
    Given I navigate to a non-existent collection ID
    Then  I should see "Collection not found" message
