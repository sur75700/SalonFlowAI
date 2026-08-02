import unittest

from app.intelligence.context import IntelligenceContext
from app.intelligence.execution import (
    create_execution_context,
    get_execution_snapshot,
)
from app.intelligence.pipeline import IntelligencePipeline


class CountingLoader:
    def __init__(self) -> None:
        self.calls = 0

    def load(self) -> object:
        self.calls += 1
        return object()


class IntelligenceExecutionScopeTests(unittest.IsolatedAsyncioTestCase):
    async def test_original_context_metadata_is_not_mutated(self) -> None:
        context = IntelligenceContext(
            owner_id="owner-1",
            metadata={"request_id": "request-1"},
        )

        execution_context = create_execution_context(context)

        self.assertIsNot(execution_context, context)
        self.assertEqual(
            context.metadata,
            {"request_id": "request-1"},
        )
        self.assertEqual(
            execution_context.metadata["request_id"],
            "request-1",
        )

    async def test_snapshot_is_reused_within_one_execution(self) -> None:
        provider = object()
        loader = CountingLoader()
        context = create_execution_context(
            IntelligenceContext(owner_id="owner-1")
        )

        first = await get_execution_snapshot(
            context=context,
            domain="revenue",
            provider=provider,
            loader=loader.load,
        )
        second = await get_execution_snapshot(
            context=context,
            domain="revenue",
            provider=provider,
            loader=loader.load,
        )

        self.assertIs(first, second)
        self.assertEqual(loader.calls, 1)

    async def test_snapshot_is_not_reused_across_executions(self) -> None:
        provider = object()
        loader = CountingLoader()
        source_context = IntelligenceContext(owner_id="owner-1")

        first = await get_execution_snapshot(
            context=create_execution_context(source_context),
            domain="revenue",
            provider=provider,
            loader=loader.load,
        )
        second = await get_execution_snapshot(
            context=create_execution_context(source_context),
            domain="revenue",
            provider=provider,
            loader=loader.load,
        )

        self.assertIsNot(first, second)
        self.assertEqual(loader.calls, 2)

    async def test_snapshot_is_not_shared_between_providers(self) -> None:
        first_provider = object()
        second_provider = object()
        loader = CountingLoader()
        context = create_execution_context(
            IntelligenceContext(owner_id="owner-1")
        )

        first = await get_execution_snapshot(
            context=context,
            domain="capacity",
            provider=first_provider,
            loader=loader.load,
        )
        second = await get_execution_snapshot(
            context=context,
            domain="capacity",
            provider=second_provider,
            loader=loader.load,
        )

        self.assertIsNot(first, second)
        self.assertEqual(loader.calls, 2)

    async def test_pipeline_uses_one_execution_context_per_run(self) -> None:
        source_context = IntelligenceContext(owner_id="owner-1")
        observed_contexts = []

        def signal_builder(context):
            observed_contexts.append(context)
            return ()

        def metric_builder(context):
            observed_contexts.append(context)
            return ()

        def recommendation_builder(context, signals, metrics):
            observed_contexts.append(context)
            return ()

        def summary_builder(context, signals, metrics):
            observed_contexts.append(context)
            return "No intelligence findings were generated."

        def confidence_builder(
            context,
            signals,
            metrics,
            recommendations,
        ):
            observed_contexts.append(context)
            return (0.0, "No validated evidence was available.")

        pipeline = IntelligencePipeline(
            signal_builder=signal_builder,
            metric_builder=metric_builder,
            recommendation_builder=recommendation_builder,
            summary_builder=summary_builder,
            confidence_builder=confidence_builder,
        )

        decision = await pipeline.run(context=source_context)

        self.assertEqual(decision.owner_id, source_context.owner_id)
        self.assertEqual(len(observed_contexts), 5)

        execution_context = observed_contexts[0]

        self.assertIsNot(execution_context, source_context)
        self.assertTrue(
            all(
                context is execution_context
                for context in observed_contexts
            )
        )

    async def test_pipeline_creates_fresh_scope_for_each_run(self) -> None:
        source_context = IntelligenceContext(owner_id="owner-1")
        provider = object()
        loader = CountingLoader()

        async def signal_builder(context):
            await get_execution_snapshot(
                context=context,
                domain="revenue",
                provider=provider,
                loader=loader.load,
            )
            return ()

        async def metric_builder(context):
            await get_execution_snapshot(
                context=context,
                domain="revenue",
                provider=provider,
                loader=loader.load,
            )
            return ()

        pipeline = IntelligencePipeline(
            signal_builder=signal_builder,
            metric_builder=metric_builder,
            recommendation_builder=(
                lambda context, signals, metrics: ()
            ),
            summary_builder=(
                lambda context, signals, metrics:
                "No intelligence findings were generated."
            ),
            confidence_builder=(
                lambda context, signals, metrics, recommendations:
                (0.0, "No validated evidence was available.")
            ),
        )

        await pipeline.run(context=source_context)
        await pipeline.run(context=source_context)

        self.assertEqual(loader.calls, 2)


if __name__ == "__main__":
    unittest.main()
