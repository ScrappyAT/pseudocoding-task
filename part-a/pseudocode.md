# Part A — Pseudocode

## Function 1 — Money Logic: `prorate()`

**Source:** `lib/proration.ts` from my Subscription Slice project

### What the function does

When a customer changes plans partway through a billing period, this function works out how much of what they already paid is still unused and credits it against the new plan's price. It does all the math in minor units (e.g. kobo) so no decimal rounding errors creep in.

### Inputs

- `paidAmountMinor` — the amount the customer paid for the current period, in minor units (integer)
- `periodStart` — the date/time the current billing period began
- `periodEnd` — the date/time the current billing period ends
- `now` — the moment the plan change happens
- `newPlanAmountMinor` — the price of the new plan for a full period, in minor units (integer)

### Output

An integer in minor units: the net amount to charge now, which is the new plan price minus the credit for unused time on the old plan. It is never negative.

### First Pseudocode Attempt

FUNCTION prorate

INPUT:
- paidAmountMinor
- periodStart
- periodEnd
- now
- newPlanAmountMinor

OUTPUT:
- netAmountDueMinor (integer, minor units)

STEPS:

1. Validate all inputs (amounts are non-negative integers, dates are valid, periodEnd is after periodStart). Stop with an error if any check fails.

2. Calculate totalPeriod = periodEnd − periodStart (in milliseconds).

3. Calculate elapsed = now − periodStart.

4. Clamp elapsed between 0 and totalPeriod, so a `now` outside the period can't give a negative or over-100% result.

5. Calculate remaining = totalPeriod − elapsed.

6. Calculate the unused credit: creditMinor = FLOOR(paidAmountMinor × remaining ÷ totalPeriod). Multiply before dividing and round down to a whole minor unit.

7. Make sure creditMinor is never more than paidAmountMinor.

8. Calculate netAmountDueMinor = newPlanAmountMinor − creditMinor.

9. If netAmountDueMinor is below 0, set it to 0. Then return netAmountDueMinor.

ERROR / INVALID CONDITIONS:
- periodEnd is equal to or earlier than periodStart (total period would be zero or negative, causing divide-by-zero)
- paidAmountMinor or newPlanAmountMinor is negative, not an integer, or not a number
- `now` or either period date is missing or not a valid date

### Review Notes

After comparing my first pseudocode attempt with the actual implementation, I found several differences:

1. The function returns four values, not just the final amount to charge.
2. The calculation works with whole days rather than directly prorating milliseconds.
3. I originally rounded the unused credit down, but the implementation rounds it up using `CEILING`.
4. I added an explicit step to prevent the credit from exceeding the amount paid, but the actual function does not contain that step.
5. I assumed all dates were explicitly validated, but invalid `Date` values are not directly checked.
6. The final charge is prevented from becoming negative by taking the greater of zero and the calculated amount.

### Corrected Pseudocode Attempt

FUNCTION prorate

INPUTS:
- paidAmountMinor — amount already paid for the current billing period, in minor units
- periodStart — start date of the current billing period
- periodEnd — end date of the current billing period
- now — date/time when the plan change is being calculated
- newPlanAmountMinor — full price of the new plan, in minor units

OUTPUT:
- daysInPeriod — total number of days in the billing period
- daysRemaining — number of whole days remaining in the billing period
- creditMinor — credit for the unused portion of the current plan
- chargeMinor — amount the customer needs to pay for the new plan

SIDE EFFECTS:
- None. The function only performs calculations and returns a result.

FAILS WHEN:
- paidAmountMinor is not a non-negative integer
- newPlanAmountMinor is not a non-negative integer
- periodEnd is equal to or earlier than periodStart

STEPS:

1. IF paidAmountMinor is not a whole number OR is less than zero
       STOP with an error
   END IF

2. IF newPlanAmountMinor is not a whole number OR is less than zero
       STOP with an error
   END IF

3. Calculate daysInPeriod from periodStart and periodEnd.
   IF periodEnd is equal to or earlier than periodStart
       STOP with an error
   END IF

4. Calculate daysRemaining using periodStart, periodEnd, and now.

5. Calculate the unused credit:
       creditMinor = CEILING(
           paidAmountMinor × daysRemaining ÷ daysInPeriod
       )

6. Calculate the amount to charge:
       chargeMinor = newPlanAmountMinor - creditMinor

7. IF chargeMinor is less than zero
       set chargeMinor to 0
   END IF

8. RETURN:
       daysInPeriod
       daysRemaining
       creditMinor
       chargeMinor

### Hand Trace 1 — Normal Input

#### Input

- paidAmountMinor = 250000
- newPlanAmountMinor = 2500000
- periodStart = 2026-09-01
- periodEnd = 2026-10-02
- now = 2026-09-13

#### Manual Trace

1. Total billing period:
   daysInPeriod = 31 days

2. Days elapsed:
   September 1 to September 13 = 12 whole days

3. Days remaining:
   daysRemaining = 31 - 12
   daysRemaining = 19

4. Calculate unused credit:
   creditMinor = CEILING(250000 × 19 ÷ 31)

   creditMinor = CEILING(153225.806...)
   creditMinor = 153226

5. Calculate charge:
   chargeMinor = 2500000 - 153226
   chargeMinor = 2346774

#### Predicted Result

daysInPeriod = 31
daysRemaining = 19
creditMinor = 153226
chargeMinor = 2346774

#### Actual Result

Ran the real `prorate()` from `lib/proration.ts` with the input above:

```
daysInPeriod  = 31
daysRemaining = 19
creditMinor   = 153226
chargeMinor   = 2346774
```

#### Comparison

| Value | Predicted | Actual | Match? |
| --- | --- | --- | --- |
| `daysInPeriod` | 31 | 31 | ✅ |
| `daysRemaining` | 19 | 19 | ✅ |
| `creditMinor` | 153226 | 153226 | ✅ |
| `chargeMinor` | 2346774 | 2346774 | ✅ |

All four values matched.

### Hand Trace 2 — Edge Case

#### Scenario

The customer changes to a cheaper plan at the very beginning of the billing period. The unused credit from the current plan is greater than the new plan's price.

#### Input

- paidAmountMinor = 250000
- newPlanAmountMinor = 100000
- periodStart = 2026-09-01
- periodEnd = 2026-10-02
- now = 2026-09-01

#### Manual Trace

1. Total billing period:
   daysInPeriod = 31 days

2. Days elapsed:
   now = periodStart, so elapsed = 0 whole days

3. Days remaining:
   daysRemaining = 31 - 0
   daysRemaining = 31

4. Calculate unused credit:
   creditMinor = CEILING(250000 × 31 ÷ 31)

   creditMinor = CEILING(250000)
   creditMinor = 250000

5. Calculate charge before clamping:
   chargeMinor = 100000 - 250000
   chargeMinor = -150000

6. Clamp the charge so it can never be negative:
   chargeMinor = MAX(0, -150000)
   chargeMinor = 0

#### Predicted Result

daysInPeriod = 31
daysRemaining = 31
creditMinor = 250000
chargeMinor = 0

#### Actual Result

Ran the real `prorate()` from `lib/proration.ts` with the input above:

```
daysInPeriod  = 31
daysRemaining = 31
creditMinor   = 250000
chargeMinor   = 0
```

The credit (250000) is larger than the new plan's price (100000), so the raw charge of -150000 is floored at zero. There is no refund path — the excess credit is simply absorbed.

#### Comparison

| Value | Predicted | Actual | Match? |
| --- | --- | --- | --- |
| `daysInPeriod` | 31 | 31 | ✅ |
| `daysRemaining` | 31 | 31 | ✅ |
| `creditMinor` | 250000 | 250000 | ✅ |
| `chargeMinor` | 0 | 0 | ✅ |

All four values matched.

### Hand Trace 3 — Invalid Input

#### Input

- paidAmountMinor = -1
- newPlanAmountMinor = 2500000
- periodStart = 2026-09-01
- periodEnd = 2026-10-02
- now = 2026-09-13

#### Manual Trace

The function validates its two amount inputs before it touches any dates. So the very first thing it does with this input is look at `paidAmountMinor`.

1. Check whether `paidAmountMinor` is a non-negative integer.
   The validation condition is:
   `Number.isInteger(paidAmountMinor) is false OR paidAmountMinor < 0`

   - `Number.isInteger(-1)` → true. -1 **is** an integer, so this half of the
     condition passes.
   - `-1 < 0` → true. -1 is less than 0, so this half of the condition fails.

2. Because the condition is an `OR`, one failing half is enough:
   `false OR true` → true. The validation condition therefore fails.

3. The function throws immediately:
   `throw new Error("paidAmountMinor must be a non-negative integer, got -1")`

4. Control never reaches the rest of the function, so the following are never
   computed:
   - `daysInPeriod` — not calculated
   - `daysRemaining` — not calculated
   - `creditMinor` — not calculated
   - `chargeMinor` — not calculated

5. No `ProrateResult` object is returned. The caller receives an exception
   instead of a quote.

#### Predicted Behaviour / Error

The function throws an error immediately, before any period or proration
calculation is performed.

```
paidAmountMinor must be a non-negative integer, got -1
```

#### Actual Behaviour / Error

Ran the real `prorate()` from `lib/proration.ts` with the input above:

```
THREW
  error.name    = Error
  error.message = paidAmountMinor must be a non-negative integer, got -1
  instanceof Error = true
```

No `daysInPeriod`, `daysRemaining`, `creditMinor` or `chargeMinor` was returned —
`prorate()` threw rather than returning a partial result.

#### Comparison

| Aspect | Predicted | Actual | Match? |
| --- | --- | --- | --- |
| Outcome | Throws an error | Throws an error | ✅ |
| Error message | `paidAmountMinor must be a non-negative integer, got -1` | `paidAmountMinor must be a non-negative integer, got -1` | ✅ (exact string match) |
| Error type | `Error` | `Error` | ✅ |
| Thrown at | Before any period or proration calculation | Before any period or proration calculation | ✅ |
| `daysInPeriod` | Not calculated | Not calculated | ✅ |
| `daysRemaining` | Not calculated | Not calculated | ✅ |
| `creditMinor` | Not calculated | Not calculated | ✅ |
| `chargeMinor` | Not calculated | Not calculated | ✅ |

**They matched.** The predicted error message was compared as an exact string against the real error's `message` property and was character-for-character identical.

#### Note on Why the Order Matters

`paidAmountMinor` is the first thing the function validates, ahead of `newPlanAmountMinor` and ahead of any date handling. That ordering matters because a negative `paidAmountMinor` would otherwise reach the credit calculation and produce a negative credit, which `Math.max(0, ...)` on the charge would then silently mask — the customer would be charged the full new plan price with no sign anything was wrong. Failing fast turns a silent wrong answer into a loud error.

## Function 2 — Background Job Processing: `WorkerProcess.process()`

**Source:** `src/worker/worker.ts` from my background job system project, approximately lines 162–221.

### What the function does

The function processes a job that has already been claimed by a worker. It finds the correct handler and runs it. If the job succeeds, it tries to mark it as succeeded. If it fails, it records the failure and either schedules a retry, marks the job as dead, or ignores the update if this worker no longer owns the job. Regardless of how processing ends, it removes the job from the worker's active set.

The thing I want to hold onto while reading this one is that the job is already claimed by the time it gets here. The claim — the `UPDATE ... SET status = 'processing'` that made this worker the owner — happened earlier, in the claim cycle. So this method never competes for the job, it only tries to finish it. Every write it makes is conditional on still being the owner, and the way that is enforced is by matching on both the job ID and the attempt number.

### Inputs

The method takes a single input, a `JobRow` that represents an already-claimed background job. The fields that actually matter to it are:

- `job` — a `JobRow` representing an already-claimed background job
- `job.id` — job identifier
- `job.type` — determines which handler should process it
- `job.payload` — data passed to the handler
- `job.attempts` — current attempt number and ownership token
- `job.max_attempts` — maximum number of attempts allowed

`job.attempts` does double duty, which is the part I found least obvious at first. It is passed to the handler so a handler can behave differently on a retry (the `testFailureMode=once` handler only fails when the attempt is 1), but it is also the ownership token. The `WHERE id = $1 AND status = 'processing' AND attempts = $2` clause in every write depends on it, so if the attempt number has moved on, the update matches zero rows and this worker is no longer the owner.

Beyond the job, the method also reads and writes `WorkerProcess` state:

- `this.id` — the worker identifier, used as a prefix on every log line so a shared log can be split per worker
- `this.active` — the set of job IDs currently being processed; the method reads its size for the log lines and deletes this job's ID from it at the end
- `this.concurrency` — the configured worker concurrency; the poll loop uses `this.active.size` against it to decide how many more jobs to claim, which is why the entry has to be removed even when the job failed

### Output

The method returns `Promise<void>`. It does not return a business result directly.

The result of the handler is not the return value of this method — it is written to the `job_results` table by the success path. So the caller of `process()` learns nothing from the resolved value; everything this method does is a side effect. The effects are reflected through database updates, logging, and removal of the job from the active set. If you want to know how a job went, you read the jobs table, not this method's return value.

### Side Effects

- may mark a database job as succeeded
- may store the job result
- may reschedule a failed job as pending
- may mark a job as dead
- writes diagnostic information to the console
- removes the job ID from `this.active`

The last one is unconditional, which is the important detail. Success, handler failure, a missing handler, and a failed failure-record all end with the same `finally` step. I went looking for the case where the job could leak a slot in `this.active` and there isn't one, which is the whole point of using `finally` here.

### First Pseudocode Attempt

FUNCTION process

INPUT:
- job — the already-claimed job to process

OUTPUT:
- nothing directly; the method returns no value

STATE USED:
- this.id — this worker's identifier, used to prefix log lines
- this.active — set of job IDs currently being processed
- this.concurrency — the configured worker concurrency

STEPS:

1. Save the current attempt number from job.attempts.
   This is the ownership token — every write below is conditional on it.

2. TRY:

   a. Find the handler registered for job.type.
      IF no handler is registered for that type
         RAISE an error: `no handler registered for job type "<type>"`
      END IF

   b. Run the handler, passing it job.payload and the saved attempt number.
      WAIT for the handler to finish.
      The handler returns a result object.

   c. Try to mark the job as succeeded, using the job ID, the saved attempt
      number, and the result.
      This is conditional — the database only updates the row if the job is
      still 'processing' AND its attempts still match the saved attempt.
      It reports back whether the row was actually owned.

   d. IF the job was still owned by this worker
         LOG that the job finished with status=succeeded, and how many jobs
         are active now
      ELSE
         LOG that the completion was stale and has been ignored because
         this worker no longer owns the job
      END IF

3. CATCH any error raised anywhere in the main processing path above.
   This includes: no handler registered, the handler throwing, and the
   success update itself throwing.

   a. Convert the error into a message string.
      IF the error is an Error, use its message.
      OTHERWISE use the string form of the error value.

   b. Calculate the retry schedule for the saved attempt number.
      The schedule contains an exponential delay, a random jitter, the
      total delay, and the run-at time derived from it.

   c. Try to record the failure, passing the job ID, the message, the saved
      attempt number, job.max_attempts, and the schedule's delay.
      The database decides the outcome and reports back which one it is:
        - 'retry'   — attempts remain, so the job was put back to pending
                      with a new run-at time
        - 'dead'    — attempts are exhausted, so the job was marked dead
        - 'not_owned' — the update matched no rows, because this worker is
                      no longer the owner of the job
      The retry/dead decision is made by the database, not here, because
      only the database knows the current attempt count.

   d. IF recording the failure itself throws
         LOG that the outcome could not be recorded, along with the
         database/persistence error
         STOP the failure-handling path and go to the cleanup step
      END IF

   e. IF the outcome is 'retry'
         LOG that the job failed on this attempt
         LOG the retry schedule: the total delay, the exponential delay, the
         jitter, and the run-at time
         LOG that the job finished with status=pending
      ELSE IF the outcome is 'dead'
         LOG that the job is dead, including the last error message
      ELSE
         LOG that the job failed but this worker no longer owns it, so the
         outcome was not recorded
      END IF

4. FINALLY, in every case:
   Remove the job ID from this.active.

Note on the `active` count in the log lines: the count printed is
`this.active.size - 1`. The cleanup step has not run yet at the point the
message is written, so subtracting one gives the count the worker will
actually have once the job is removed.

FAILS / FAILURE PATHS:
- no handler exists for the job type
- handler throws
- success completion is rejected because ownership was lost
- failure recording reports ownership was lost
- recording the failure itself throws

The three ownership-lost paths are worth separating, because they are not all the same thing and only one of them is an error:

- "success completion is rejected because ownership was lost" is not a
  failure at all. The handler ran fine and produced a result. The update
  simply matched no rows, so the result is dropped and the job is logged as
  a stale completion. Nothing is retried and nothing is marked dead.
- "failure recording reports ownership was lost" happens after the handler
  genuinely failed. The update matches no rows, so the failure is never
  written anywhere. The job's fate is left to whichever worker does own it
  now, which will find it stuck and recover it.
- "recording the failure itself throws" is the only one that is a real
  infrastructure problem. The database call did not merely report a lost
  update; it blew up. The message is lost, the retry is never scheduled,
  and the job stays in 'processing' until the stuck-job sweep finds it.

The last two are the failure modes I would care most about in production, because in both of them the job's real outcome is not recorded anywhere and correctness depends entirely on the stuck-job recovery sweep picking it up later.

### Hand Trace 1 — Normal Success

#### Scenario

A `review_analysis` job is claimed by this worker and the handler runs cleanly. The worker still owns the job when it tries to write the success, so the success is recorded and the job is logged as finished.

#### Input

- job.id = "job-001"
- job.type = "review_analysis"
- job.payload = { review: "Great product" }
- job.attempts = 1
- job.max_attempts = 5

#### Assumed Dependency Behaviour

These are the black-box assumptions, not things I verified inside `process()`:

- `getHandler("review_analysis")` returns a valid handler
- the handler successfully returns a result
- `completeJobSucceeded("job-001", 1, result)` returns true
- "job-001" is currently inside `this.active`

#### Manual Trace

1. Line 163: `attempt = job.attempts` → **1**.
2. Line 165: `getHandler("review_analysis")` is called. A handler is found, so the
   `if (!handler)` guard on line 166 does not fire and nothing is thrown.
3. Line 169: the handler is awaited with `job.payload` and `{ attempt: 1 }`. It
   returns a result. The `result` local now holds that object.
4. Line 170: `completeJobSucceeded("job-001", 1, result)` is called — job ID, the
   saved attempt, and the handler's result.
5. It returns true, so `owned` is true. This means the update matched a row, i.e.
   this worker still owns attempt 1.
6. Line 171 takes the `if (owned)` branch and logs the success. The count in the
   message is `this.active.size - 1`, which is 0 here because "job-001" is the
   only job in the set, and 1 has not been subtracted yet — the `finally` has not
   run. So the line reports the count the worker *will* have.
7. The `catch` on line 181 is **not** entered. Nothing on that path runs.
8. Control leaves the `try` block and reaches `finally` on line 218.
9. Line 219: `this.active.delete("job-001")`. The ID is removed.
10. `computeRetryDelay` on line 183 is never reached, so no retry delay is
    calculated.
11. `recordJobFailure` on line 186 is never reached, so no failure is recorded.

#### Predicted Behaviour

- `process()` resolves with `undefined`
- exactly one log line: a finished/succeeded message for job-001
- `computeRetryDelay` is never called
- `recordJobFailure` is never called
- "job-001" is removed from `this.active`

#### Actual / Implementation Verification

I compiled the real `worker.ts` and drove the real `process()` with the four
dependencies replaced by stubs that return exactly the assumed values. The
method body is untouched — I hashed lines 162–221 of my working copy against the
project file and they are byte-identical, and the only two edits to the working
copy were adding `export` to the class declaration and guarding the module-level
`worker.start()` call so the class could be instantiated without booting a poll
loop. `computeRetryDelay` was the *real* one, not a stub.

Observed dependency call order:

```
getHandler("review_analysis")
handler(payload={"review":"Great product"} attempt=1)
completeJobSucceeded(job-001, 1, {"sentiment":"positive","score":0.9})
```

Observed console output:

```
[worker-<pid>] finished job job-001 attempt=1 status=succeeded active=0/3
```

Observed state: resolved value `undefined`; `this.active.has("job-001")` is
`false` afterwards.

I also ran a second pass with three jobs in `this.active` to pin down the
`size - 1` in the log line. With `this.active.size` at 3 before the call, the
line printed `active=2/3` and the set ended at size 2 containing only the other
two IDs. So the subtraction really is reporting the post-cleanup count, and only
this job's ID is removed.

#### Comparison

| Step | Predicted | Actual | Match? |
| --- | --- | --- | --- |
| `attempt` set | 1 | 1 | ✅ |
| Handler found for `review_analysis` | yes | yes | ✅ |
| Handler awaited with payload and attempt | yes | yes, `attempt=1` | ✅ |
| `completeJobSucceeded` args | `job-001`, 1, result | `job-001, 1, {sentiment:positive,score:0.9}` | ✅ |
| Returned value | `true` | `true` | ✅ |
| `catch` entered | no | no | ✅ |
| `finally` executed | yes | yes | ✅ |
| Job ID removed from `this.active` | yes | yes | ✅ |
| `computeRetryDelay` called | no | no | ✅ |
| `recordJobFailure` called | no | no | ✅ |
| Return type | `Promise<void>` (resolves `undefined`) | resolves `undefined` | ✅ |
| Success logged | yes | yes, `status=succeeded` | ✅ |

All predicted steps matched. One thing worth recording: `process()` cannot
distinguish success from a swallowed failure by its return value. Both resolve
to `undefined`, so the only way to tell them apart is the log line.

### Hand Trace 2 — Edge Case: Lost Ownership

#### Scenario

The handler runs fine and produces a result, but by the time the worker tries to
write the success it is no longer the owner of that job attempt. The success
update is refused.

#### Input

- job.id = "job-002"
- job.type = "review_analysis"
- job.payload = { review: "Good product" }
- job.attempts = 1
- job.max_attempts = 5

#### Assumed Dependency Behaviour

- `getHandler` returns a valid handler
- the handler successfully returns a result
- `completeJobSucceeded("job-002", 1, result)` returns false
- "job-002" is currently inside `this.active`

The `false` return means this worker no longer owns that job attempt.

#### Manual Trace

1. Line 163: `attempt = job.attempts` → **1**.
2. Line 165: `getHandler("review_analysis")` returns a handler, so nothing throws.
3. Line 169: the handler is awaited and returns a result. Nothing about the lost
   ownership is visible to `process()` yet — it cannot know until it writes.
4. Line 170: `completeJobSucceeded("job-002", 1, result)` is called.
5. It returns false, so `owned` is false.
6. The successful handler result is NOT allowed to overwrite the newer job
   attempt. Note where this is actually enforced: `process()` does not do the
   guarding, it only reacts to the boolean. The refusal happens inside
   `completeJobSucceeded`, whose UPDATE is
   `WHERE id = $1 AND status = 'processing' AND attempts = $2` and whose
   `INSERT INTO job_results` is itself conditional on
   `updated.rowCount > 0`. Zero rows updated means the result is never stored.
7. Line 176 takes the `else` branch and logs the stale-completion message.
8. The `catch` on line 181 is **not** entered. The handler did not fail, and the
   refusal is reported as a return value rather than thrown, so nothing is
   treated as an error.
9. No retry is scheduled. `computeRetryDelay` is inside the `catch` and is never
   reached.
10. No failure is recorded. `recordJobFailure` is never reached.
11. `finally` on line 218 executes.
12. Line 219: `this.active.delete("job-002")`.

#### Why the Ownership Guard Matters

An older worker must not overwrite the result or state belonging to a newer
attempt. Consider the timeline: this worker claims job-002 at attempt 1, the
handler is slow, the job is declared stuck, the sweep hands it to another worker
which claims it as attempt 2, and that second worker finishes first and writes
its result. When the first worker finally returns, the `attempts = $2` predicate
no longer matches, because the row is now at attempt 2 and already `succeeded`.
Without that predicate the slow worker would blindly write its stale result over
the correct one and re-stamp `finished_at`. The customer's stored result would
depend on which worker happened to be slower, which is exactly the kind of
non-determinism that is very hard to debug later. The same guard on the failure
path stops a stale worker from resetting a job that a newer attempt has already
rescheduled.

#### Predicted Behaviour

- `process()` resolves with `undefined` — this is not treated as a failure
- exactly one log line: the stale-completion-ignored message
- the handler's result is discarded, not stored
- no retry scheduled, no failure recorded
- "job-002" is removed from `this.active`

#### Actual / Implementation Verification

Same harness, `completeJobSucceeded` stubbed to return `false`. Observed
dependency call order:

```
getHandler("review_analysis")
handler(payload={"review":"Good product"} attempt=1)
completeJobSucceeded(job-002, 1, {"sentiment":"positive","score":0.7})
```

Observed console output:

```
[worker-<pid>] job job-002 attempt=1 stale completion ignored (no longer owned)
```

Observed state: did not throw; `this.active.has("job-002")` is `false`
afterwards.

The control that discards the result is confirmed in
`src/worker/jobs.worker.repository.ts`: the `INSERT INTO job_results` sits
inside `if ((updated.rowCount ?? 0) > 0)`, so a `false` return and "no result
row" are the same event. `process()`'s contribution is only to log it.

I also confirmed the inverse half: with the same input and the stub returning
`true`, the same worker printed the `status=succeeded` line instead. So the
branch really is selected by the return value and nothing else.

#### Comparison

| Step | Predicted | Actual | Match? |
| --- | --- | --- | --- |
| `attempt` set | 1 | 1 | ✅ |
| Handler found | yes | yes | ✅ |
| Handler ran successfully | yes | yes | ✅ |
| `completeJobSucceeded` called with job-002, 1, result | yes | yes | ✅ |
| Returned value | `false` | `false` | ✅ |
| Result not allowed to overwrite newer attempt | yes | yes, guarded by `rowCount` in the repository | ✅ |
| Stale-completion message logged | yes | yes, `stale completion ignored (no longer owned)` | ✅ |
| `catch` entered | no | no | ✅ |
| Retry scheduled | no | no | ✅ |
| Failure recorded | no | no | ✅ |
| `finally` executed | yes | yes | ✅ |
| Job ID removed from `this.active` | yes | yes | ✅ |
| Return type | `Promise<void>` | resolves `undefined` | ✅ |

All predicted steps matched. The one caveat is that "the result is not stored"
is not observable from `process()` alone — it is guaranteed by
`completeJobSucceeded` returning `false`, and the two are linked in the
repository code, not in the worker.

### Hand Trace 3 — Failure: Unknown Job Type / Dead Letter

#### Scenario

The job's type has no registered handler. The function cannot do the work, and
this job is on its last attempt, so the failure is recorded as dead-lettered
rather than retried.

#### Input

- job.id = "job-003"
- job.type = "unknown_type"
- job.payload = {}
- job.attempts = 5
- job.max_attempts = 5

#### Assumed Dependency Behaviour

- `getHandler("unknown_type") returns no handler`
- `computeRetryDelay` succeeds
- `recordJobFailure` returns "dead"
- "job-003" is currently inside `this.active`

#### Manual Trace

1. Line 163: `attempt = job.attempts` → **5**.
2. Line 165: `getHandler("unknown_type")` is called.
3. No handler is found, so the `if (!handler)` guard on line 166 fires and the
   function throws:
   `no handler registered for job type "unknown_type"`
   The type is interpolated straight into the message, so the quoted type in the
   message is exactly `unknown_type`.
4. The throw is caught by the `catch` on line 181. Control moves into the
   failure-handling path.
5. Line 182: the value is an `Error`, so `message = error.message` →
   `no handler registered for job type "unknown_type"`.
6. Line 183: `computeRetryDelay(5, config.jobBaseDelayMs)` is called for attempt
   5. The schedule carries an exponential delay, a jitter, a total delay, and a
   run-at time.
7. Lines 186–192: `recordJobFailure` is called with job-003, the error message,
   attempt 5, `job.max_attempts` of 5, and the schedule's `delayMs`.
8. `recordJobFailure` returns `"dead"`.
9. Line 197 tests `outcome === 'retry'` — false. Line 208 tests
   `outcome === 'dead'` — true, so the dead-letter branch is taken.
10. Lines 209–212 log the dead status together with the last error message.
11. `finally` on line 218 executes.
12. Line 219: `this.active.delete("job-003")`.
13. The job handler never runs — the throw on line 167 happens before the handler
    call on line 169.
14. `completeJobSucceeded` is never called — it sits on line 170, past the throw.

#### Predicted Behaviour

- `getHandler` is called with `"unknown_type"` and returns nothing
- the function throws `no handler registered for job type "unknown_type"` internally
- the error message is extracted from the `Error`
- `computeRetryDelay` is called for attempt 5
- `recordJobFailure` is called with job-003, the message, attempt 5, max_attempts
  5, and the computed delay
- the `"dead"` branch runs and logs the dead status and last error
- `finally` removes "job-003" from `this.active`
- the handler and `completeJobSucceeded` are never reached
- `process()` itself does not rethrow; it resolves normally

#### Actual / Implementation Verification

Same harness, `getHandler` returning `undefined` for anything other than
`review_analysis` (which is what the real registry in
`src/worker/job.handlers.ts` does — it registers exactly one key) and
`recordJobFailure` stubbed to return `"dead"`. `computeRetryDelay` was the real
implementation, so the delay in the output is genuinely computed.

Observed dependency call order:

```
getHandler("unknown_type")
recordJobFailure(job-003, "no handler registered for job type \"unknown_type\"", 5, 5, 16122)
```

Observed console output:

```
[worker-<pid>] job job-003 attempt=5 dead lastError="no handler registered for job type "unknown_type""
```

Observed state: did not throw out of `process()`;
`this.active.has("job-003")` is `false` afterwards.

Every predicted step is confirmed, with two things worth calling out.

First, a discrepancy in the log text. The dead branch interpolates the message
into a `lastError="..."` field, but the message itself contains double quotes
and they are not escaped, so the rendered line is
`lastError="no handler registered for job type "unknown_type""` — the quoting is
ambiguous, and a log parser reading that field will mis-split it. This is
cosmetic rather than a control-flow problem, and it only shows up on the
dead-letter path, which is precisely the path you most want to grep later.

Second, an assumption I had to correct. An unknown job type does not dead-letter
on its own. I re-ran the same trace with `attempts = 1` and `max_attempts = 5`,
and `recordJobFailure` returning `"retry"` produced:

```
[worker-<pid>] job job-004 attempt=1 failed
[worker-<pid>] retry scheduled delayMs=1362 exponentialMs=1000 jitterMs=362 runAt=...
[worker-<pid>] finished job job-004 attempt=1 status=pending active=0/3
```

So the dead-letter outcome here comes from the attempt count being exhausted, not
from the error being unrecoverable. In `recordJobFailure` the branch is chosen
by `attempt < maxAttempts`. The practical consequence is that a job row with a
type nobody registered will be retried, with backoff, until it burns every
attempt, and only then dead-letter. For a pure configuration error that is not a
bug and the retries will never succeed — a fail-fast check for unknown job types
before dispatch would be cheaper, but that is outside this function.

A third observation, on wasted work: `computeRetryDelay` is called on line 183
before the outcome is known, so a dead-lettered job still pays for a jittered
backoff calculation whose result is then discarded — `schedule.delayMs` is only
meaningful on the retry path.

I also exercised the neighbouring failure path, where `recordJobFailure` itself
throws, to check the "stop" step in the pseudocode. With the stub throwing,
`process()` logged
`failed to record outcome for job job-005: Error: connection terminated unexpectedly`,
returned normally rather than propagating, and still removed "job-005" from
`this.active` — the `return` on line 195 does not skip `finally`. This confirms
the pseudocode's instruction to stop the failure-handling path and fall through
to cleanup.

#### Comparison

| Step | Predicted | Actual | Match? |
| --- | --- | --- | --- |
| `attempt` set | 5 | 5 | ✅ |
| `getHandler` called with `"unknown_type"` | yes | yes | ✅ |
| No handler found | yes | yes, real registry has only `review_analysis` | ✅ |
| Thrown message | `no handler registered for job type "unknown_type"` | identical | ✅ (exact) |
| `catch` entered | yes | yes | ✅ |
| Message extracted from the `Error` | yes | yes | ✅ |
| `computeRetryDelay` called for attempt 5 | yes | yes, delay computed and passed | ✅ |
| `recordJobFailure` args | job-003, message, 5, 5, delay | `job-003, "no handler registered for job type \"unknown_type\"", 5, 5, 16122` | ✅ |
| Returned outcome | `"dead"` | `"dead"` | ✅ |
| Dead-letter branch taken | yes | yes | ✅ |
| Dead status and error logged | yes | yes | ⚠️ see note |
| `finally` executed | yes | yes | ✅ |
| Job ID removed from `this.active` | yes | yes | ✅ |
| Handler invoked | no | no | ✅ |
| `completeJobSucceeded` called | no | no | ✅ |
| `process()` rethrows | no | no, resolves `undefined` | ✅ |

The control flow matched on every step. The one ⚠️ is the log formatting, not
the branch: the dead-status line is emitted as expected, but the `lastError`
field renders with unescaped nested double quotes
(`lastError="no handler registered for job type "unknown_type""`), so a reader
cannot tell where the message ends. The message content itself is correct.

The other correction to my own starting assumptions is that `"dead"` is not
caused by the unknown job type — it is caused by the attempts being exhausted.

## Function 3 — Authentication Security: `POST()` Sign-in Handler

**Source:** `app/api/auth/signin/route.ts` from my auth slice project.

### What the function does

The sign-in endpoint:

- parses and validates the submitted credentials
- applies IP and email rate limits
- looks up the user
- verifies the password
- uses a dummy bcrypt hash when the user does not exist so the timing of the password check does not reveal whether an email is registered
- returns the same invalid-credentials response for an unknown email and a wrong password
- requires email verification
- creates a session only after all security checks pass

The ordering is the security story. Every gate that can reject the request costs little and runs before anything expensive or stateful. JSON and schema validation reject garbage for free, the two rate-limit checks run before either of them wastes a database hit, and the user lookup happens once — one email, one query. Then, intentionally, the password check runs even for a user that does not exist, so the expensive part does not announce the lookup result. Only after that can a real response differ.

### Inputs

- `request` — HTTP Request
- `body` — parsed JSON request body
- `email` — validated and normalized email
- `password` — submitted password
- `ip` — client IP derived from the request

Relevant external dependencies/state:

- `signinSchema` — the zod schema that validates the body and normalizes the email (trim + lowercase must run before `.email()` validates the normalized value)
- `RATE_LIMITS.signin` — `{ limit: 10, windowSeconds: 900 }`: ten attempts per fifteen minutes, applied twice per request, once keyed on the IP and once on the submitted email
- `checkRateLimit()` — prunes expired hits, counts the window, inserts the hit only if the request is actually allowed (a blocked request does not extend its own block), and computes `Retry-After` from the oldest surviving hit
- `prisma.user.findUnique()` — the single user lookup, keyed on the normalized email
- `verifyPassword()` — real bcrypt compare (cost 12, via `BCRYPT_COST_FACTOR` in `lib/auth/password.ts`)
- `DUMMY_PASSWORD_HASH` — a fixed, cost-12 bcrypt hash of a placeholder no real password will ever match, substituted when no user exists
- `createSession()` — writes a hashed session token to the database and sets the `session` httpOnly cookie

### Output

The important possible responses:

- 400 — invalid JSON
- 400 — validation failure
- 429 — rate limit exceeded
- 401 — invalid email or password
- 403 — correct credentials but email not verified
- 200 — successful sign-in

Details worth recording: the invalid-credentials response is one constant pair, `INVALID_CREDENTIALS_BODY = { error: "Invalid email or password" }` and `INVALID_CREDENTIALS_STATUS = 401`, reused on both failure paths so the two can never drift apart. The rate-limit response carries a `Retry-After` header computed from how long until the oldest hit ages out of the window. The 403 is deliberately a *different*, more specific message than the 401 — by the time the code reaches it, the password has already proven the account exists and belongs to the caller, so there is nothing left to protect by staying vague (the source comment says exactly this).

### Side Effects

- rate-limit records may be created
- database user lookup
- successful authentication creates a session
- successful authentication sets the session cookie through `createSession()`

Because of the rate-limiter's design, a side effect of an *allowed* request is a new `rateLimitHit` row for both the IP key and the email key — meaning an attacker probing credentials also spends down the victim email's own window, not just their IP's.

`createSession()` in turn: generates 32 random bytes, stores only the token's SHA-256 hash in the `session` table, and sets the `session` cookie with `httpOnly`, `secure` (in production), `sameSite: lax`, `path: /`, and a 7-day `maxAge` that matches the database expiry.

### First Pseudocode Attempt

FUNCTION POST

INPUT:
- request — the incoming HTTP request

OUTPUT:
- HTTP response (one of 400, 429, 401, 403, 200)

STEPS:

1. Parse the request body as JSON.
   IF the body cannot be parsed
      RETURN 400 with { error: "Invalid JSON body" }
   END IF

2. Validate the parsed body against signinSchema.
   IF validation fails
      RETURN 400 with { error: "Validation failed", fieldErrors: <field errors> }
   END IF
   The schema has already normalized the email (trimmed, lowercased).

3. Extract the normalized email and the password from the parsed data.

4. Read the signin rate-limit configuration (limit 10, window 900s).

5. Determine the client IP from the request.
   This reads the first entry of the X-Forwarded-For header, or "unknown"
   if the header is absent.

6. Check the IP rate limit.
   IF the IP is blocked
      RETURN 429 with { error: "Too many attempts. Try again later." }
             and a Retry-After header
   END IF

7. Check the email rate limit.
   IF the email is blocked
      RETURN 429 with { error: "Too many attempts. Try again later." }
             and a Retry-After header
   END IF

8. Look up the user by email: prisma.user.findUnique.

9. Choose the hash to verify against:
   - the real user's password hash if the user exists
   - DUMMY_PASSWORD_HASH if the user does not exist

10. Run password verification regardless of whether the user exists.
    bcrypt.compare does the same cost-12 work on both branches.

11. IF the user does not exist OR the password is invalid
        RETURN 401 with { error: "Invalid email or password" }
    END IF

12. IF the user's email is not verified
        RETURN 403 with { error: "Please verify your email before signing in" }
    END IF

13. Create a session for the user: createSession.

14. RETURN 200 with { message: "Signed in." }

SECURITY / FAILURE PATHS:
- malformed JSON
- schema validation failure
- IP rate limited
- email rate limited
- unknown email
- wrong password
- unverified email

One nuance worth keeping straight: in step 11, the `OR` is deliberate. With an unknown email the user does not exist, so `!user` alone satisfies the condition and the 401 fires no matter what the password check returned. With a real user, `!user` is false and the decision comes entirely from the password check. Both end on the same constant response.

### Hand Trace 1 — Normal / Authorized Login

#### Scenario

A correctly formatted sign-in for a real, verified account. Every gate permits the request and the account's password matches, so the request runs the whole path to a session and a 200.

#### Input

- email = "ada@example.com"
- password = "correct-horse-battery"

#### Assumed Dependency Behaviour

- JSON parsing succeeds
- schema validation succeeds
- normalized email remains "ada@example.com"
- IP rate limit allows the request
- email rate limit allows the request
- `prisma.user.findUnique` returns an existing user
- `verifyPassword` returns true
- `user.emailVerifiedAt` contains a valid date
- `createSession` succeeds

#### Manual Trace

1. `request.json()` parses the body successfully, so the `body === null` guard is
   false and no 400 is returned.
2. `signinSchema.safeParse(body)` succeeds. The email comes out normalized.
3. `email = "ada@example.com"`, `password = "correct-horse-battery"` are
   extracted.
4. `RATE_LIMITS.signin` yields `{ limit: 10, windowSeconds: 900 }`.
5. `getClientIp` returns the IP (first `X-Forwarded-For` entry).
6. The IP key `signin:ip:<ip>` is checked and allowed; a hit row is recorded.
7. The email key `signin:email:ada@example.com` is checked and allowed; a hit row
   is recorded.
8. `prisma.user.findUnique({ where: { email: "ada@example.com" } })` returns the
   existing user.
9. The real user's `passwordHash` is selected (the user exists).
10. `verifyPassword("correct-horse-battery", <real hash>)` returns true.
11. The combined guard `!user || !passwordValid` is `false || false` → false, so
    the 401 branch is skipped.
12. `user.emailVerifiedAt` is a valid date, so the 403 branch is skipped.
13. `createSession(user.id)` is awaited: a session row is created and the session
    cookie is set.
14. Return 200 with `{ message: "Signed in." }`.

#### Predicted Behaviour

- both rate-limit checks pass
- real password hash is used
- password verification succeeds
- invalid-credentials branch is skipped
- email-verification branch is skipped
- session is created
- response status is 200
- response body is `{ message: "Signed in." }`

#### Actual / Implementation Verification

I copied `app/` and `lib/` to a scratch area outside the repository, compiled the
real signin route to CommonJS, and drove `POST()` with the real zod schema, real
`getClientIp`, real `checkRateLimit`, and real bcrypt. The only substitutions
were a fake `prisma` object and a fake `createSession` (the latter because
setting a cookie needs the Next.js runtime). `RATE_LIMITS` reported
`{"limit":10,"windowSeconds":900}` and `BCRYPT_COST_FACTOR` reported 12. The
scratch copy of the route is byte-identical to the project file.

Observed dependency call order:

```
prisma.rateLimitHit.deleteMany   :: key=signin:ip:203.0.113.10
prisma.rateLimitHit.count        :: key=signin:ip:203.0.113.10
prisma.rateLimitHit.create       :: key=signin:ip:203.0.113.10
prisma.rateLimitHit.deleteMany   :: key=signin:email:ada@example.com
prisma.rateLimitHit.count        :: key=signin:email:ada@example.com
prisma.rateLimitHit.create       :: key=signin:email:ada@example.com
prisma.user.findUnique           :: email=ada@example.com
verifyPassword(bcrypt.compare)   :: compared against the REAL user hash
createSession                    :: userId=user_ada_123
```

Observed response: status 200, body `{"message":"Signed in."}`, session recorded
for `user_ada_123`. The `set-cookie` header is not observable in this harness
because the real `createSession` uses `next/headers`. I also confirmed that the
schema in the actual `schemas.ts` normalizes `"  Ada@Example.COM  "` to
`"ada@example.com"` before it ever reaches the database.

#### Comparison

| Step | Predicted | Actual | Match? |
| --- | --- | --- | --- |
| IP rate-limit check | passes | passes, key `signin:ip:<ip>` | ✅ |
| Email rate-limit check | passes | passes, key `signin:email:ada@example.com` | ✅ |
| User lookup | returns the user | `findUnique` called with the normalized email | ✅ |
| Hash used | real `passwordHash` | real user hash (instrumented) | ✅ |
| `verifyPassword` result | true | true (cost-12 bcrypt) | ✅ |
| Invalid-credentials branch | skipped | skipped | ✅ |
| Email-verification branch | skipped | skipped | ✅ |
| Session created | yes | yes, for `user_ada_123` | ✅ |
| Response status | 200 | 200 | ✅ |
| Response body | `{ message: "Signed in." }` | `{"message":"Signed in."}` | ✅ |

All ten predicted points matched.

### Hand Trace 2 — Edge / Security Case: Unknown Email

#### Scenario

The sign-in is well formed and both rate limits allow it, but the submitted address has no account. The endpoint must still behave as if a password check happened.

#### Input

- email = "nobody@example.com"
- password = "hunter2"

#### Assumed Dependency Behaviour

- JSON parsing succeeds
- schema validation succeeds
- both rate limits allow the request
- `prisma.user.findUnique` returns null
- `verifyPassword(password, DUMMY_PASSWORD_HASH) returns false`

#### Manual Trace

1. `request.json()` parses; `body` is an object, no 400.
2. `signinSchema.safeParse` succeeds; email normalizes to `nobody@example.com`.
3. IP rate limit check: allowed (spends one hit on the IP key).
4. Email rate limit check: allowed (spends one hit on the email key).
5. `prisma.user.findUnique({ where: { email: "nobody@example.com" } })` returns
   null — the user lookup produces no user.
6. The code does NOT skip password verification. The hash expression is
   `user?.passwordHash ?? DUMMY_PASSWORD_HASH`. `user` is null, so
   `user?.passwordHash` is `undefined`, and the `??` operator selects
   `DUMMY_PASSWORD_HASH`.
7. `verifyPassword("hunter2", DUMMY_PASSWORD_HASH)` still runs — real
   cost-12 bcrypt work against the dummy hash.
8. `passwordValid` is false. The dummy hash is a syntactically valid bcrypt hash
   of a fixed placeholder, so this comparison can only ever return false; every
   password submitted for a nonexistent account necessarily fails it.
9. The combined condition `!user || !passwordValid` is evaluated:
   `!user` is `!null` → true. Since it is an `OR`, the condition is true and the
   body of the check runs; the password result would not even need to be looked
   at (and for a nonexistent user it is always false anyway).
10. Return 401 with the exact shared response body and status.
11. No session is created. `createSession` is never reached.

#### Predicted Behaviour

- user lookup returns no user
- the code does NOT skip password verification
- `DUMMY_PASSWORD_HASH` is selected
- `verifyPassword` still runs
- `passwordValid` becomes false
- the combined `!user || !passwordValid` condition is true
- response status is 401
- response body is exactly `{ error: "Invalid email or password" }`
- no session is created

#### Actually Verified

The same harness, with `findUnique` returning null. Observed call order:

```
prisma.rateLimitHit.deleteMany/count/create   :: key=signin:ip:203.0.113.10
prisma.rateLimitHit.deleteMany/count/create   :: key=signin:email:nobody@example.com
prisma.user.findUnique                        :: email=nobody@example.com
verifyPassword(bcrypt.compare)                :: passwordLen=7 hash=DUMMY_HASH
```

Observed response: status 401, body exactly `{"error":"Invalid email or password"}`, no session, no `createSession` call. And `verifyPassword` really did run against the dummy hash — I instrumented the actual bcrypt module and the trace records `hash=DUMMY_HASH`. So there is no early return before the password check.

#### Why the Dummy Hash Exists (and the honest limit of what it gives you)

The dummy hash exists to reduce the timing difference between an unknown email
and a real account with a wrong password. Without it, "no such user" would
return almost instantly while "wrong password" would take the ~600ms of a
cost-12 bcrypt compare — a timing side channel that leaks exactly what the
identical response body is trying to hide (this is stated in the source comment
at lines 11–17).

I do NOT claim the timing is mathematically identical, and the implementation
does not guarantee that either. What the implementation guarantees is narrower
but real: the bcrypt verification work is deliberately performed on both paths,
so the two responses are in the same ballpark instead of one being
near-instant. To be concrete about the residual gaps: the two hashes are
different strings (different salts), so any per-hash, per-input variance shows
up; the user lookup itself differs (a real row vs. an empty result); network I/O
to the database is not part of my harness; and a clever attacker measuring an
endpoint through a proxy sees the whole HTTP round-trip, not the isolated
compare. On my machine, sampling the two paths in-process gave ~245ms for both,
dominated by the shared cost-12 bcrypt — encouraging evidence that the
mitigation works, not a proof of regulatory-grade indistinguishability.

#### Comparison

| Step | Predicted | Actual | Match? |
| --- | --- | --- | --- |
| User lookup returns no user | yes | `findUnique` → null | ✅ |
| Password verification not skipped | yes | `verifyPassword` invoked | ✅ |
| Hash selected | `DUMMY_PASSWORD_HASH` | instrumented trace: `hash=DUMMY_HASH` | ✅ |
| `verifyPassword` runs | yes | yes, real bcrypt.compare | ✅ |
| `passwordValid` | false | false | ✅ |
| Combined condition | true | true | ✅ |
| Response status | 401 | 401 | ✅ |
| Response body | `{ error: "Invalid email or password" }` | `{"error":"Invalid email or password"}` | ✅ (exact) |
| Session created | no | no | ✅ |

All nine predicted points matched.

### Hand Trace 3 — Invalid / Unauthorized: Real User, Wrong Password

#### Scenario

The submitted email is real and verified, but the password is wrong. This must be indistinguishable from the unknown-email case.

#### Input

- email = "ada@example.com"
- password = "wrong"

#### Assumed Dependency Behaviour

- JSON parsing succeeds
- schema validation succeeds
- both rate limits allow the request
- `prisma.user.findUnique` returns the real, verified user
- `verifyPassword(password, user.passwordHash)` returns false

#### Manual Trace

1. `request.json()` parses; no 400.
2. `signinSchema.safeParse` succeeds; email normalizes to `ada@example.com`.
3. IP rate limit check: allowed.
4. Email rate limit check: allowed.
5. `prisma.user.findUnique({ where: { email: "ada@example.com" } })` returns the
   real user (row present, `emailVerifiedAt` set).
6. The real password hash is used, because the user exists.
7. `verifyPassword("wrong", <real hash>)` still performs full cost-12 bcrypt
   work. Comparisons against a real account are the case the cost factor is
   tuned against: one honest login is imperceptible, but each guess against an
   attacker-driven flood is ~600ms.
8. `passwordValid` is false.
9. The combined condition: `!user` is false (a real user was found), `!passwordValid`
   is true. `false || true` → true, so the branch is taken.
10. The function returns immediately with the shared 401 constant. Since the
    `return` happens here, the later checks are not reached:
    `user.emailVerifiedAt` is never checked, and `createSession` is never
    called — even though this is a perfectly verified account that happens to
    have been given the wrong password this time.
11. Response status 401, shared body.

#### Predicted Behaviour

- real user is found
- real password hash is used
- password verification still performs bcrypt work
- `passwordValid` is false
- `!user` is false
- `!passwordValid` is true
- combined condition is therefore true
- response status is 401
- response body is exactly `{ error: "Invalid email or password" }`
- `emailVerifiedAt` is never checked because the function already returned
- `createSession` is never called

#### Actually Verified

Same harness, `findUnique` returning the real verified user whose stored hash is
a bcrypt hash of a different password. Observed call order:

```
prisma.rateLimitHit.deleteMany/count/create   :: key=signin:ip:203.0.113.10
prisma.rateLimitHit.deleteMany/count/create   :: key=signin:email:ada@example.com
prisma.user.findUnique                        :: email=ada@example.com
verifyPassword(bcrypt.compare)                :: passwordLen=5 hash=<real user hash>
```

Observed response: status 401, body exactly `{"error":"Invalid email or password"}`, no session. The trace confirms the real hash was the one compared, and that the function still ran the bcrypt work before rejecting.

#### Comparison

| Step | Predicted | Actual | Match? |
| --- | --- | --- | --- |
| Real user found | yes | `findUnique` → row | ✅ |
| Hash used | real `passwordHash` | instrumentation: real user hash | ✅ |
| bcrypt work performed | yes | yes, cost 12 | ✅ |
| `passwordValid` | false | false | ✅ |
| `!user` | false | false | ✅ |
| `!passwordValid` | true | true | ✅ |
| Combined condition true | yes | yes (short-circuit through second operand) | ✅ |
| Response status | 401 | 401 | ✅ |
| Response body | `{ error: "Invalid email or password" }` | `{"error":"Invalid email or password"}` | ✅ (exact) |
| `emailVerifiedAt` checked | no | no, the 401 `return` precedes it | ✅ |
| `createSession` called | no | no | ✅ |

All eleven predicted points matched.

### Hand Trace 2 vs Hand Trace 3 — the point of the exercise

Both must produce the same:

- HTTP status: 401
- response body: `{ error: "Invalid email or password" }`

Verified: identical in my harness run — both `401` and both
`{"error":"Invalid email or password"}`, character for character, and neither
created a session.

The implementation also deliberately performs password-hash verification on both
paths: trace 2 compared the submitted password against `DUMMY_PASSWORD_HASH`,
trace 3 against the real hash, and both were genuine cost-12 bcrypt compares.
This is intended to reduce account-enumeration information leaked through
response timing. It narrows the side channel the identical body creates, it does
not and cannot eliminate it — the two hashes are different strings, the database
lookup differs, and everything between the database and the attacker's
stopwatch adds jitter. So the honest claim is: the response is byte-for-byte the
same, and the expensive operation is performed on both paths so its duration is
no longer a reliable signal. An account-probing attacker swapping between the
two cases sees the same status, the same body, and a similar-order bcrypt cost
on both — which is the entire purpose of the pair.

One design detail worth flagging while the two traces are side by side: for a
nonexistent account this arrangement is extra-safe in a way that is easy to
miss. Even if `verifyPassword` against the dummy hash ever returned true —
which it cannot, for any password — the `!user` half of the `OR` would still
make the condition true and return the identical 401. The response is protected
twice, by both halves of the guard, whereas for a real user it is protected by
exactly one.