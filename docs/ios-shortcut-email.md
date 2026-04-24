# iPhone Shortcut Email Snapshot

## Why this exists

`https://james.hubiedubois.com/` is a static site. If a Shortcut fetches the page HTML directly, it does **not** receive the live age values that the browser calculates in JavaScript.

Use the dedicated JSON payload instead:

- `https://james.hubiedubois.com/shortcut-data.json`

That keeps the Shortcut tied to the website while avoiding brittle HTML scraping.

## Recommended shortcut

Create a shortcut named `Email James Snapshot`.

Use these actions in order.

## 1. Fetch the website data

1. `URL`
   Value: `https://james.hubiedubois.com/shortcut-data.json`
2. `Get Contents of URL`
   Method: `GET`
   Rename the result variable to `Site Data`
3. `Get Dictionary Value`
   Input: `Site Data`
   Key: `name`
   Rename the result variable to `Name`
4. `Get Dictionary Value`
   Input: `Site Data`
   Key: `birthIso`
   Rename to `Birth ISO`
5. `Get Dictionary Value`
   Input: `Site Data`
   Key: `birthLabel`
   Rename to `Birth Label`
6. `Get Dictionary Value`
   Input: `Site Data`
   Key: `sourceUrl`
   Rename to `Source URL`
7. `Get Dictionary Value`
   Input: `Site Data`
   Key: `adulthoodIso`
   Rename to `Adulthood ISO`
8. `Get Dictionary Value`
   Input: `Site Data`
   Key: `milestones`
   Rename to `Milestones`

## 2. Turn the JSON into dates

9. `Date`
   Input: `Birth ISO`
   Rename to `Birth Date`
10. `Date`
    Input: `Adulthood ISO`
    Rename to `Adulthood Date`
11. `Current Date`
    Rename to `Now`
12. `Format Date`
    Input: `Now`
    Format: `Custom`
    Pattern: `MMMM d, yyyy 'at' h:mm:ss a`
    Rename to `Run Timestamp`

## 3. Pull the headline totals

13. `Get Time Between Dates`
    Start Date: `Birth Date`
    End Date: `Now`
    Unit: `Days`
    Rename to `Days Alive`
14. `Get Time Between Dates`
    Start Date: `Birth Date`
    End Date: `Now`
    Unit: `Months`
    Rename to `Total Months`
15. `Get Time Between Dates`
    Start Date: `Birth Date`
    End Date: `Now`
    Unit: `Weeks`
    Rename to `Total Weeks`
16. `Get Time Between Dates`
    Start Date: `Birth Date`
    End Date: `Now`
    Unit: `Hours`
    Rename to `Total Hours`
17. `Get Time Between Dates`
    Start Date: `Birth Date`
    End Date: `Now`
    Unit: `Minutes`
    Rename to `Total Minutes`
18. `Get Time Between Dates`
    Start Date: `Birth Date`
    End Date: `Now`
    Unit: `Seconds`
    Rename to `Total Seconds`
19. `Get Time Between Dates`
    Start Date: `Now`
    End Date: `Adulthood Date`
    Unit: `Days`
    Rename to `Days To 18`

## 4. Rebuild the exact current age

This mirrors the website logic closely enough for a Shortcut report.

20. `Get Time Between Dates`
    Start Date: `Birth Date`
    End Date: `Now`
    Unit: `Years`
21. `Round Number`
    Input: result from step 20
    Mode: `Always Round Down`
    Rename to `Years`
22. `Adjust Date`
    Date: `Birth Date`
    Add: `Years`
    Unit: `Years`
    Rename to `After Years`
23. `Get Time Between Dates`
    Start Date: `After Years`
    End Date: `Now`
    Unit: `Months`
24. `Round Number`
    Input: result from step 23
    Mode: `Always Round Down`
    Rename to `Months`
25. `Adjust Date`
    Date: `After Years`
    Add: `Months`
    Unit: `Months`
    Rename to `After Months`
26. `Get Time Between Dates`
    Start Date: `After Months`
    End Date: `Now`
    Unit: `Days`
27. `Round Number`
    Input: result from step 26
    Mode: `Always Round Down`
    Rename to `Days`
28. `Adjust Date`
    Date: `After Months`
    Add: `Days`
    Unit: `Days`
    Rename to `After Days`
29. `Get Time Between Dates`
    Start Date: `After Days`
    End Date: `Now`
    Unit: `Hours`
30. `Round Number`
    Input: result from step 29
    Mode: `Always Round Down`
    Rename to `Hours`
31. `Adjust Date`
    Date: `After Days`
    Add: `Hours`
    Unit: `Hours`
    Rename to `After Hours`
32. `Get Time Between Dates`
    Start Date: `After Hours`
    End Date: `Now`
    Unit: `Minutes`
33. `Round Number`
    Input: result from step 32
    Mode: `Always Round Down`
    Rename to `Minutes`
34. `Adjust Date`
    Date: `After Hours`
    Add: `Minutes`
    Unit: `Minutes`
    Rename to `After Minutes`
35. `Get Time Between Dates`
    Start Date: `After Minutes`
    End Date: `Now`
    Unit: `Seconds`
36. `Round Number`
    Input: result from step 35
    Mode: `Always Round Down`
    Rename to `Seconds`

## 5. Next birthday and progress to age 18

37. `Calculate Expression`
    Expression: `Years + 1`
    Rename to `Next Age`
38. `Adjust Date`
    Date: `Birth Date`
    Add: `Next Age`
    Unit: `Years`
    Rename to `Next Birthday Date`
39. `Format Date`
    Input: `Next Birthday Date`
    Format: `Custom`
    Pattern: `MMMM d, yyyy`
    Rename to `Next Birthday Label`
40. `Get Time Between Dates`
    Start Date: `Now`
    End Date: `Next Birthday Date`
    Unit: `Days`
    Rename to `Days To Next Birthday`
41. `Get Time Between Dates`
    Start Date: `Birth Date`
    End Date: `Now`
    Unit: `Seconds`
    Rename to `Age Seconds`
42. `Get Time Between Dates`
    Start Date: `Birth Date`
    End Date: `Adulthood Date`
    Unit: `Seconds`
    Rename to `Adulthood Seconds`
43. `Calculate Expression`
    Expression: `(Age Seconds / Adulthood Seconds) * 100`
    Rename to `Life Progress Raw`
44. `Round Number`
    Input: `Life Progress Raw`
    Decimal Places: `2`
    Rename to `Life Progress`

## 6. Optional milestone block

If you want the email to include the milestone dates from the site:

45. `Text`
    Value: ``
    Rename to `Milestone Lines`
46. `Repeat with Each`
    Input: `Milestones`
47. Inside the repeat:
    - `Get Dictionary Value`
      Input: `Repeat Item`
      Key: `age`
    - `Get Dictionary Value`
      Input: `Repeat Item`
      Key: `dateLabel`
    - `Text`
      Value: `Age [age]: [dateLabel]
`
    - `Add to Variable`
      Variable: `Milestone Lines`
48. End repeat.

If you want countdowns for each milestone too, add another `Get Dictionary Value` for `dateIso`, convert it with `Date`, compare to `Now`, and append either `Reached` or the remaining days.

## 7. Build the email body

49. `Text`

Use this body:

```text
James snapshot

Run time: [Run Timestamp]
Source: [Source URL]
Born: [Birth Label]

Current age:
[Years] years, [Months] months, [Days] days
[Hours] hours, [Minutes] minutes, [Seconds] seconds into the current day

Days on Earth: [Days Alive]
Next birthday: [Next Birthday Label]
Days until birthday [Next Age]: [Days To Next Birthday]
Days until 18: [Days To 18]
Progress to 18: [Life Progress]%

Total months: [Total Months]
Total weeks: [Total Weeks]
Total hours: [Total Hours]
Total minutes: [Total Minutes]
Total seconds: [Total Seconds]

Milestones:
[Milestone Lines]
```

## 8. Send the email

50. `Send Email`
   Recipient: your email address
   Subject: `James snapshot - [Run Timestamp]`
   Message: the `Text` output from step 49
   Turn `Show Compose Sheet` off if you want it to send without prompting.

## 9. Make it an automation on the iPhone

1. Open the Shortcuts app on the iPhone.
2. Tap `Automation`.
3. Tap `+`.
4. Choose a trigger such as `Time of Day`.
5. Pick the schedule.
6. Choose `Run Immediately` or turn off `Ask Before Running`, depending on what your iPhone shows.
7. Select the `Email James Snapshot` shortcut.
8. Save it.

## Notes

- If you only need a daily or weekly report, a `Time of Day` automation is the cleanest trigger.
- If Mail asks for permission the first time, run the shortcut manually once before relying on the automation.
- If `Get Time Between Dates` returns decimals on your iPhone, add `Round Number` with `Always Round Down` after those steps to match the website's whole-number counters.
- The exact labels in Shortcuts can vary slightly by iOS version, but the actions above are the core ones to look for.
