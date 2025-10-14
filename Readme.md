# Taskmaster Series 20 Episode 5 - Studio task

Eat the Lamé duck, or don't eat the Lamé duck (made out of vegan chocolate).

- If 1 person eats the duck and the other 4 do not, the duck eater gets 5 points added to their series points total, and everyone else loses 1 point.
- If >1 person eats the duck, the duck eaters lose 3 points and everyone else gains 3 points.
- If everyone eats the duck, then everyone gets given £25.
- If no one eats the duck, then everyone must give Greg £25.

Determining the optimum strategy in this task is challenging. To come up with an answer it is necessary to make at
 least some assumptions. The key questions are: How do the players value points vs cash? And how should the players value points being added 
 to the series total of the *other* players?

Here, we analyse the game under a variety of different assumptions, starting with the simplest case, and then making things progressively
more complicated.

## If someone cares only about money, not points

If someone cares only about money, not points, then it is easy to figure out *their* optimum strategy: *they should eat the duck.*
This is because, if you only care about money, then choosing to eat the duck will sometimes make your situation
better, and it will never make it worse:

- If the other 4 players eat their ducks, then if you eat your duck as well you will gain £25.
- If the other 4 players are not eating their duck, then if you eat your duck you will avoid losing £25.
- In all other situations, eating or not eating the duck will make no difference to how much cash you have.

## If *everyone* cares only about points, not money

Next, we will consider the case in which *every* player cares only about points, not money. In addition, we will also assume
that every player knows that every other player only cares about points. This is common knowledge.

In this situation, there is no longer one choice that is clearly best for these players. Why? Well, it can't be best for everyone to not eat
their duck, because if everyone else is not eating their duck, then you can gain an advantage by eating yours
(you gain 5 points and they all lose 1). But conversely, if everyone else is eating their duck, then you can gain an advantage by *not* eating yours 
(you gain 3 points and they all lose 3).

Interestingly, the two scenarios just described are both equally valuable. This is because players should not care if everyone gains or loses
exactly the same number of points, since they are only competing against each other (Sanjeev makes this point on the show).
And in both situations, you gain the same relative advantage of 6 points over your opponents. This is all that matters.
Alex Horne has chosen different numbers only to make the task sound more confusing than it already was, in characteristic fashion.

But the symmetry between eating and not eating the duck is broken by the situations in which we have a 2 vs 3 split. In these situations,
not eating the duck is always the better strategy (all non-eaters gain a relative advantage of 6 over all eaters). So in at least some sense,
not eating the duck seems a *better* choice than eating the duck. It wins in more situations than it loses. 
But we can't say that everyone should predictably not eat their duck, or they could be exploited by someone who deviates and eats theirs.
So what should a rational player do?

### Nash equilibrium

We are playing a game where our best move depends on what the other players do, and they make their decision in secret. In games like this, you can't find the optimum strategy with maths alone. That's because the optimum strategy is to accurately predict what the other players are going to do, and respond accordingly, and that is a problem of psychology, not mathematics.

However, using Game Theory, you can calculate something called the Nash equilibrium strategy. This is a strategy with the following property:

*If all players are following the Nash equilibrium strategy, then no individual player can benefit by deviating from the Nash equilibrium strategy.*

In this sense, the Nash equilibrium strategy represents a kind of stable situation. In an interesting game, the Nash equilibrium strategy will involve selecting from a few options at random, according to particular probabilities. For example, in Rock/Paper/Scissors, the Nash equilibrium strategy is to select between Rock, Paper, or Scissors, with 1/3 probability each. This still isn't so interesting, because all moves are equally good. But in more complicated games, like this one, the Nash strategy will have you selecting between the different moves with different probabilities.
We can now make precise the sense in which not eating the duck is better than eating it: it will be assigned a higher probability in the Nash equilibrium strategy.

If you had a perfectly rational self-interested player, who knew for certain that all of the other players were also perfectly rational and self-interested, then you might expect this player to adopt the Nash equilibrium strategy when playing the game. Why is this? Well no other strategy would make sense for them. If you were to propose that a rational self-interested player should instead pursue strategy X, then they should expect that all the other players will play X as well, since we are assuming they are all reasoning similarly. But if all the other players are playing X, and X is not a Nash equilibrium strategy, then X is not the best strategy to pick in response, and we have a contradiction.

But it is important to stress that this does not mean a player following the Nash equilibrium strategy will always come out on top against players who are following a different strategy. For example, in Rock/Paper/Scissors, if a player follows the Nash equilibrium strategy of randomly picking between the moves with 1/3 probability each, then their chance of eventual victory (and their opponent's) will always be 50/50. This is true whatever their opponent is doing. They have no advantage over any opponent.

So what is the Nash equilibrium strategy in this game, when all players care only about points?

### How to value the mixed case

Before we can calculate the Nash equilibrium strategy, we first need to decide how to value the situations with a 2 vs 3 split.

If you are the only player who does not eat your duck, then you gain a relative advantage of 6 points over all of your opponents.
And to make things easy for us, this relative advantage is exactly the same as the opposite case where you are the only player who *does* eat your duck.
But what if two people do not eat their duck (as happened on the show)? Now, you gain an advantage of 6 points over 3 of your opponents,
but your situation relative to your 4th opponent is left unchanged. How should you value this, relative to the first case?

It is difficult to give a definitive answer to this question. Lets suppose that what each player cares about is their probability
of eventually becoming series champion (already you could question this assumption: maybe a player actually cares more about not coming last!)
We then need to calculate the effect of a given distribution of points among the players on each player's probability of series victory.
But this is going to be very complicated to work out in general.
It would require us to look at each player's current series scores, and also to assign a probability distribution for how many points we expect
each of them to go on to achieve during the remainder of the series.

This will get messy, so we won't do that. Instead, to proceed, we are going to have to make some more simplifying assumptions:

- We assume that all points changes during this task are *small* relative to the overall series scores. This is a reasonable assumption.
- We assume that the points changes relative to each opponent are valued in exactly the same way. This is a less realistic assumption, since 
presumably we expect that some opponents are more likely to go on to win the series than others. If we are trying to maximize our probability of
winning the series, then we should care more about our points advantage over them than over someone who is likely to come last anyway. But we're
going to ignore this here and treat all opponents on the same footing.

Using the first assumption, we can expect the change in probability of series victory to be given by:

$\Delta P = \sum{c_{i} v_{i}} + O(v_{i}^{2})$

where $v_{i}$ is the relative points advantage over the ith player, and the $c_i$ are some set of constants
(the partial derivatives of $P$).

The second assumption now allows us to conclude that all of the $c_{i}$ are equal, so there is only a single constant undetermined.
And this single constant is irrelevant for determining the strategy with highest expected value, so we now have all we need.
The value of an outcome is proportional to the sum of the relative points advantage over each opponent.

We will pick the constant so that we assign value using the *average* points advantage. So we will say that the situation where you gain +5 and
everyone else loses 1 has value 6. A situation where you and another gain 3, and everyone else loses 3, has value:

$\frac{1}{4}\left(0+6+6+6\right) = \frac{9}{2}$

### Computing the Nash equilibrium strategy

We are now ready to compute the Nash equilibrium strategy in the situation where every player cares only about points, not at all
about cash, and every player knows that every other player feels this way.

Suppose that in Nash equilibrium, the probability of any player choosing to *not* eat the duck is $p$. Now take the perspective of one
of the players. If this is a Nash equilibrium, there must be no incentive for this player to deviate from the Nash equilibrium strategy.
And for this to be the case, the expected value of eating the duck must be the same as the expected value of not eating the duck. This constraint
gives us a polynomial equation in $p$ which we will be able to solve.

$E(\text{eating duck}) = (6) p^{4} + {{4}\choose{1}}(\frac{-3.6}{4}) p^3 (1-p) + {{4}\choose{2}} (\frac{-2.6}{4}) p^2 (1-p)^2 + {{4}\choose{3}} (\frac{-6}{4}) p (1-p)^3 + (0) p^4$

$E(\text{not eating duck}) = (0) p^{4} + {{4}\choose{1}} (\frac{-6}{4}) p^3 (1-p) + {{4}\choose{2}} (\frac{2.6}{4}) p^2 (1-p)^2 + {{4}\choose{3}} (\frac{3.6}{4}) p (1 - p)^3 + (6) (1-p)^4$

Imposing that these are equal gives us:

$6 (1-p)^4 + 6 {{4}\choose{1}} p (1-p)^3 + 6 {{4}\choose{2}} p^2 (1-p)^2 + \frac{2.6}{4} {{4}\choose{3}} p^3 (1-p) - 6 p^4 = 0$

And this simplifies quite nicely to:

$6 \left((p + (1-p))^4 - \frac{1}{2} {{4}\choose{3}} p^3 (1-p) - 2 p^4 \right) = 0$

$1 - 2 p^3 (1-p) -2 p^4 = 0$

$p = \left(\frac{1}{2}\right)^{\frac{1}{3}} \approx 0.79$

So in Nash equilibrium, each player should randomly choose not to eat their duck 79% of the time, and choose to eat their duck 21% of the time.

This result aligns with our previous intuition that not eating the duck is a better option than eating it (even though you should 
still eat it sometimes). It also means that we should expect about 1 of the 5 players to eat their duck. This makes sense. If we were very
confident that more than 1 player would eat their duck, then not eating the duck would become the best strategy. And if we were very confident
that none of our opponents were going to eat their duck, then eating the duck would become our best strategy. It makes sense that the Nash equilibrium
lies somewhere between these extremes.


## If *everyone* has the same conversion factor between points and money

