@incident-resolve @regression
Feature: Incident Resolution Greeting Comment
  As a ServiceNow customer/caller
  I want an automated greeting comment with my incident details when my incident is resolved
  So that I am informed with a courteous resolution notification

  Scenario: Automatically add greeting comment with short description on incident resolution
    Given user is authenticated on the ServiceNow instance
    When user creates an incident with short description "Fluent SDK Auto Resolution Test"
    And user transitions the incident state to "Resolved"
    And user saves the resolved incident record
    Then an activity comment should be added containing "regarding \"Fluent SDK Auto Resolution Test\" has been marked as Resolved."
