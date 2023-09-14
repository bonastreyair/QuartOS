import { BaseQueryFn, skipToken } from "@reduxjs/toolkit/dist/query";
import { QueryHooks } from "@reduxjs/toolkit/dist/query/react/buildHooks";
import {
  QueryDefinition,
  UpdateDefinitions,
} from "@reduxjs/toolkit/dist/query/endpointDefinitions";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiEndpointQuery } from "@reduxjs/toolkit/dist/query/core/module";

const RATE = 1;

export function useInfiniteQuery<B extends BaseQueryFn, T extends string, R, P>(
  endpoint: ApiEndpointQuery<
    QueryDefinition<P & { page?: number; perPage?: number }, B, T, R[]>,
    UpdateDefinitions<never, T, never>
  > &
    QueryHooks<
      QueryDefinition<P & { page?: number; perPage?: number }, B, T, R[]>
    >,
  params: P,
  perPage: number,
  reference: MutableRefObject<HTMLDivElement | null>,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedParams = useMemo(() => params, [JSON.stringify(params)]);

  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const [data, setData] = useState<R[]>([]);
  const [isExhausted, setIsExhausted] = useState(false);

  const cont = page < pages && !isExhausted;

  const arg = cont
    ? {
        ...memoizedParams,
        page,
        perPage,
      }
    : skipToken;

  const query = endpoint.useQuery(arg as any);

  const handleReset = useCallback(() => {
    setData([]);
    setIsExhausted(false);
    setPage(0);
    setPages(1);
  }, []);

  useEffect(() => {
    handleReset();
  }, [memoizedParams, handleReset]);

  useEffect(() => {
    const ref = reference.current;

    function handleScroll(event: Event) {
      if (query.isFetching) return;

      const target = event.target as HTMLDivElement;
      const clientHeight = target.clientHeight;
      const scrollTop = target.scrollTop;
      const scrollBottom = target.scrollHeight - clientHeight - scrollTop;
      if (scrollBottom <= RATE * clientHeight) {
        setPages((p) => p + 1);
      }
    }
    if (ref) {
      // Todo: deal with not enough data returned
      // if (ref.clientHeight === ref.scrollHeight) setPages((p) => p + 1);
      // else
      ref.addEventListener("scroll", handleScroll);
    }

    return () => ref?.removeEventListener("scroll", handleScroll);
  }, [query.isFetching]);

  useEffect(() => {
    if (!query.data) return;
    if (query.data.length) {
      setData((prevData) => [...prevData, ...query.data!]);
      setPage((p) => p + 1);
    } else {
      setIsExhausted(true);
    }
  }, [query.data]);

  return {
    reference,
    data,
    isUninitialized: query.isUninitialized,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isSuccess: query.isSuccess,
    isExhausted,
    error: query.error,
  };
}
